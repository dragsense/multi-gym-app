import axios, { type AxiosRequestConfig, AxiosHeaders } from "axios";
import { config } from "@/config";
import { DecryptionService } from "@/lib/decryption.service";

const decryptionService = new DecryptionService();
export const BASE_API_URL = config.apiUrl;

let csrfTokenCache: string | null = null;
let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};
/**
 * Get CSRF token - only requests from backend if not already cached
 * 
 * Note: The CSRF token cookie is httpOnly, so JavaScript cannot read it directly.
 * We use a cache to store the token value we received from the backend.
 * This prevents unnecessary API calls to fetch the token.
 */
const getCsrfToken = async (): Promise<string> => {
  // First check cache - if we already have the token, use it
  // This represents the token we received from the backend previously
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  // Only fetch from backend if we don't have it cached
  // Backend will check if cookie exists and return existing token or create new one
  try {
    const res = await axios.get(`${BASE_API_URL}/csrf-token`, {
      withCredentials: true,
    });

    // Cache the token for future use
    csrfTokenCache = res.data.csrfToken;
    return csrfTokenCache!;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
  }

  return "";
};

// Axios instance
const api = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

const refreshApi = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
});

// Request interceptor: set CSRF token and timezone
api.interceptors.request.use(async (config) => {
  const csrfToken = await getCsrfToken();

  // Ensure headers is AxiosHeaders
  if (!config.headers) config.headers = new AxiosHeaders();
  (config.headers as AxiosHeaders).set("X-CSRF-Token", csrfToken);

  // Add user timezone to all requests
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  (config.headers as AxiosHeaders).set("X-Timezone", userTimezone);

  return config;
});

// Response interceptor: handle 401 / refresh token
api.interceptors.response.use(
  async (response) => {
    if (response.data?.accessToken?.token) {
      accessToken = response.data.accessToken.token;
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.message === "Unauthorized" &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // If already refreshing, wait for it to complete
        try {
          await new Promise<string | null | undefined>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          // Retry after refresh completes with the new token
          originalRequest.headers = originalRequest.headers || {};
          (originalRequest.headers as AxiosHeaders).set(
            "Authorization",
            `Bearer ${accessToken}`
          );
          // Mark as retried to prevent infinite retry loops
          originalRequest._retry = true;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const csrf = await getCsrfToken();
        const res = await refreshApi.post(
          "/auth/refresh",
          {},
          { headers: { "X-CSRF-Token": csrf }, withCredentials: true }
        );

        // Only proceed if token refresh was successful
        if (res.data?.accessToken?.token) {
          accessToken = res.data.accessToken.token;
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;
          isRefreshing = false;

          // Resolve all queued requests
          processQueue(null, accessToken);

          // Update the original request with new token
          originalRequest.headers = originalRequest.headers || {};
          (originalRequest.headers as AxiosHeaders).set(
            "Authorization",
            `Bearer ${accessToken}`
          );

          // Retry the original request
          return api(originalRequest);
        } else {
          isRefreshing = false;
          console.error("Failed to refresh token: No access token in response");
          processQueue(error, null);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        isRefreshing = false;
        console.error("Failed to refresh token:", refreshError);
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Generic fetcher with decryption
const fetcher = async <T>(fetchConfig: AxiosRequestConfig): Promise<T> => {
  const isDevelopment = config.environment === "development";

  try {
    const res = await api.request(fetchConfig);

    if (
      fetchConfig.responseType === "arraybuffer" ||
      fetchConfig.responseType === "blob"
    ) {
      return res as unknown as T;
    }

    if (res.status === 204) return null as T;

    const payload = res.data;

    if (payload && typeof payload === "object" && payload.encrypted) {
      try {
        const decryptedData = await decryptionService.decryptResponse(payload);
        return decryptedData as T;
      } catch {
        throw new Error("Failed to decrypt response data");
      }
    }

    return payload as T;
  } catch (error: unknown) {
    // Log full error in development only
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
          error?: { message?: string };
          stack?: string;
          exceptionType?: string;
        };
        status?: number;
      };
      message?: string;
    };

    if (isDevelopment) {
      console.error("API Error:", error);
      console.error("Response data:", axiosError.response?.data);
      if (axiosError.response?.data?.stack) {
        console.error("Stack trace:", axiosError.response.data.stack);
      }
    }

    // Extract error message
    let message =
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error?.message ||
      axiosError.message ||
      "Something went wrong";

    // Handle array of messages (common in validation errors)
    if (Array.isArray(message)) {
      message = message.join(", ");
    }

    // Strip redundant backend prefixes if they exist
    if (typeof message === "string") {
      message = message.replace(/^Failed to create entity: /i, "");
      message = message.replace(/^Failed to update entity: /i, "");

      // Map common technical database errors to user-friendly messages
      if (message.includes("duplicate key value violates unique constraint")) {
        message = "A record with this information already exists.";
      } else if (message.includes("violates foreign key constraint")) {
        message = "This record cannot be deleted or modified because it is linked to other data.";
      } else if (message.includes("violates not-null constraint")) {
        const fieldMatch = message.match(/column "([^"]+)"/);
        message = fieldMatch
          ? `The field "${fieldMatch[1]}" is required.`
          : "Required information is missing.";
      }
    }

    const statusCode = axiosError.response?.status;
    const stack = axiosError.response?.data?.stack;
    const exceptionType = axiosError.response?.data?.exceptionType;

    // In development, we want to keep technical details available but separate from the primary message
    if (isDevelopment) {
      const detailedError = new Error(message);

      // Attach technical details as properties for potential debugging/UI consumption
      (detailedError as any).statusCode = statusCode;
      (detailedError as any).exceptionType = exceptionType;
      (detailedError as any).serverStack = stack;

      // Attach stack trace if available to the error object's stack property
      if (stack) {
        detailedError.stack = `${detailedError.stack}\n\nServer Stack:\n${stack}`;
      }

      throw detailedError;
    }

    // In production, only show the error message without technical details
    throw new Error(message);
  }
};

// JSON request
export const apiRequest = async <T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> => {
  return fetcher<T>({
    url: path,
    method,
    headers: new AxiosHeaders({ "Content-Type": "application/json" }),
    data: body ?? undefined,
  });
};

// File request
export const apiFileRequest = async <T>(
  path: string,
  method: "POST" | "PATCH" | "PUT",
  data: FormData
): Promise<T> => {
  return fetcher<T>({
    url: path,
    method,
    data,
  });
};

export const downloadFile = async (
  path: string,
  fileName?: string,
  mimeType?: string
) => {
  const res = await fetcher<ArrayBuffer>({
    url: path,
    method: "GET",
    responseType: "arraybuffer",
  });

  const blob = new Blob([res], { type: mimeType });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName || `file_${Date.now()}`;
  link.click();
  window.URL.revokeObjectURL(link.href);
};

export const downloadFileWithName = async (path: string) => {
  const response = await api.get(path, {
    responseType: "blob",
  });

  // Extract filename from Content-Disposition header
  const contentDisposition = response.headers["content-disposition"];
  let fileName = `file_${Date.now()}`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
    if (match?.[1]) {
      fileName = match[1];
    }
  }

  const blob = new Blob([response.data], {
    type: response.headers["content-type"] || "application/octet-stream",
  });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(link.href);
};
