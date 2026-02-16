// Utils
import {
  apiFileRequest,
  apiRequest,
  downloadFile,
  downloadFileWithName,
} from "@/utils/fetcher";
import { generateQueryParams } from "@/utils";

// Types
import type {
  IMessageResponse,
  IPaginatedResponse,
} from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";

/**
 * Generic base service class for common CRUD operations
 * Can be extended by specific services to reduce code duplication
 */
export class BaseService<
  TEntity,
  TCreateData extends Record<string, any>,
  TUpdateData extends Record<string, any>
> {
  protected apiPath: string;

  constructor(apiPath: string) {
    this.apiPath = apiPath;
  }

  /**
   * Get paginated list of entities with optional custom path
   */
  get<TResponse = TEntity>(params: IListQueryParams, customPath?: string) {
    const queryParams = new URLSearchParams();

    generateQueryParams(queryParams, params);

    let url = customPath ? `${this.apiPath}${customPath}` : `${this.apiPath}`;
    url += `?${queryParams.toString()}`;

    return apiRequest<IPaginatedResponse<TResponse>>(url, "GET");
  }

  /**
   * Get all entities (without pagination) with optional custom path
   */
  getAll<TResponse = TEntity>(
    params?: Record<string, any>,
    customPath?: string
  ) {
    const queryParams = new URLSearchParams();

    if (params) {
      generateQueryParams(queryParams, params);
    }

    let url = customPath ? `${this.apiPath}${customPath}` : `${this.apiPath}`;
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    return apiRequest<TResponse[]>(url, "GET");
  }

  /**
   * Get single entity by ID with optional query params and custom path
   */
  getSingle<TResponse = TEntity>(
    id?: any,
    queryParams?: Record<string, any>,
    customPath?: string
  ) {
    let url = customPath ? `${this.apiPath}${customPath}` : `${this.apiPath}`;

    // Only append ID if it's not empty and no custom path is provided
    if (id) {
      url += `/${id}`;
    }

    if (queryParams) {
      const params = new URLSearchParams();
      generateQueryParams(params, queryParams);
      url += `?${params.toString()}`;
    }

    console.log(url);

    return apiRequest<TResponse>(url, "GET");
  }

  /**
   * Create new entity with optional query params and custom path
   */
  post<TResponse = IMessageResponse>(
    data: TCreateData | TUpdateData,
    queryParams?: Record<string, any>,
    customPath?: string
  ) {
    let url = customPath ? `${this.apiPath}${customPath}` : `${this.apiPath}`;

    if (queryParams) {
      const params = new URLSearchParams();
      generateQueryParams(params, queryParams);
      url += `?${params.toString()}`;
    }

    return apiRequest<TResponse>(url, "POST", data);
  }

  /**
   * Update entity by ID with optional query params and custom path
   */
  put<TResponse = IMessageResponse>(id: any) {
    return (
      data: TUpdateData,
      queryParams?: Record<string, any>,
      customPath?: string
    ) => {
      let url = customPath ? `${this.apiPath}${customPath}` : `${this.apiPath}`;

      if (id) {
        url += `/${id}`;
      }

      if (queryParams) {
        const params = new URLSearchParams();
        generateQueryParams(params, queryParams);
        url += `?${params.toString()}`;
      }

      return apiRequest<TResponse>(url, "PUT", data);
    };
  }

  /**
   * Patch entity by ID with optional query params and custom path
   */
  patch<TResponse = IMessageResponse>(id: any) {
    return (
      data: TUpdateData,
      queryParams?: Record<string, any>,
      customPath?: string
    ) => {
      let url = customPath ? `${this.apiPath}${customPath}` : `${this.apiPath}`;

      if (id) {
        url += `/${id}`;
      }

      if (queryParams) {
        const params = new URLSearchParams();
        generateQueryParams(params, queryParams);
        url += `?${params.toString()}`;
      }

      return apiRequest<TResponse>(url, "PATCH", data);
    };
  }

  /**
   * Delete entity by ID with optional query params and custom path
   */
  delete<TResponse = void>(
    key: any,
    queryParams?: Record<string, any>,
    customPath?: string
  ) {
    let url = customPath ? `${this.apiPath}${customPath}` : `${this.apiPath}`;

    if (key) {
      url += `/${key}`;
    }

    if (queryParams) {
      const params = new URLSearchParams();
      generateQueryParams(params, queryParams);
      url += `?${params.toString()}`;
    }

    return apiRequest<TResponse>(url, "DELETE");
  }

  /**
   * Post with FormData (for file uploads) with optional query params and custom path
   */
  postFormData<TResponse = IMessageResponse>(
    data: TCreateData,
    queryParams?: Record<string, any>,
    customPath?: string
  ) {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        // Check if array contains Files/Blobs
        const hasFiles = value.some(item => item instanceof File || item instanceof Blob);
        
        if (hasFiles) {
          // If array contains files, append each file
          value.forEach((item) => {
            if (item instanceof File || item instanceof Blob) {
              formData.append(key, item);
            }
          });
        } else {
          // If array contains objects or complex data, stringify the entire array
          const hasObjects = value.some(item => typeof item === 'object' && item !== null);
          if (hasObjects) {
            formData.append(key, JSON.stringify(value));
          } else {
            // Simple array of primitives
            value.forEach((item) => {
              formData.append(`${key}[]`, String(item));
            });
          }
        }
      } else if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (typeof value === 'object' && value !== null) {
        // Stringify objects (e.g., productType: { id: '...' })
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    let url = customPath ? `${this.apiPath}${customPath}` : `${this.apiPath}`;
    if (queryParams) {
      const params = new URLSearchParams();
      generateQueryParams(params, queryParams);
      url += `?${params.toString()}`;
    }

    return apiFileRequest<TResponse>(url, "POST", formData);
  }

  /**
   * Patch with FormData (for file uploads) with optional query params and custom path
   */
  patchFormData<TResponse = IMessageResponse>(id: any) {
    return (
      data: TUpdateData,
      queryParams?: Record<string, any>,
      customPath?: string
    ) => {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          // Check if array contains Files/Blobs
          const hasFiles = value.some(item => item instanceof File || item instanceof Blob);
          
          if (hasFiles) {
            // If array contains files, append each file
            value.forEach((item) => {
              if (item instanceof File || item instanceof Blob) {
                formData.append(key, item);
              }
            });
          } else {
            // If array contains objects or complex data, stringify the entire array
            const hasObjects = value.some(item => typeof item === 'object' && item !== null);
            if (hasObjects) {
              formData.append(key, JSON.stringify(value));
            } else {
              // Simple array of primitives
              value.forEach((item) => {
                formData.append(`${key}[]`, String(item));
              });
            }
          }
        } else if (value instanceof File || value instanceof Blob) {
          formData.append(key, value);
        } else if (typeof value === 'object' && value !== null) {
          // Stringify objects (e.g., productType: { id: '...' })
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      let url = customPath ? `${this.apiPath}${customPath}` : `${this.apiPath}`;

      if (id) {
        url += `/${id}`;
      }

      if (queryParams) {
        const params = new URLSearchParams();
        generateQueryParams(params, queryParams);
        url += `?${params.toString()}`;
      }

      return apiFileRequest<TResponse>(url, "PATCH", formData);
    };
  }

  /**
   * Download file from endpoint
   */
  downloadFile(
    endpoint: string,
    fileName?: string,
    queryParams?: Record<string, any>,
    mimeType?: string
  ) {
    let url = `${this.apiPath}${endpoint}`;
    if (queryParams) {
      const params = new URLSearchParams();
      generateQueryParams(params, queryParams);
      url += `?${params.toString()}`;
    }
    return downloadFile(url, fileName, mimeType);
  }

  /**
   * Download file from endpoint using filename from Content-Disposition header
   */
  downloadFileWithName(endpoint: string, queryParams?: Record<string, any>) {
    let url = `${this.apiPath}${endpoint}`;
    if (queryParams) {
      const params = new URLSearchParams();
      generateQueryParams(params, queryParams);
      url += `?${params.toString()}`;
    }
    return downloadFileWithName(url);
  }
}

/**
 * Factory function to create service instances
 */
export function createService<
  TEntity,
  TCreateData extends Record<string, any>,
  TUpdateData extends Record<string, any>
>(apiPath: string): BaseService<TEntity, TCreateData, TUpdateData> {
  return new BaseService<TEntity, TCreateData, TUpdateData>(apiPath);
}
