import { useMemo } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { checkUserAvailability } from "@/services/user-availability.api";

export interface UseUserAvailabilityParams {
  userId: string;
  dateTime: string;
  duration?: number;
}

export interface UserAvailabilityResponse {
  isAvailable: boolean;
  reason?: string;
}

/**
 * Hook to check if a user is available at a specific date and time
 */
export function useUserAvailability(
  params: UseUserAvailabilityParams,
  options?: Omit<
    UseQueryOptions<UserAvailabilityResponse, Error>,
    "queryKey" | "queryFn"
  >
) {
  const { userId, dateTime, duration = 60 } = params;

  // React 19: Memoized query key for better performance
  const queryKey = useMemo(
    () => ["user-availability", userId, dateTime, duration],
    [userId, dateTime, duration]
  );

  // React 19: Memoized query function for better performance
  const queryFn = useMemo(
    () => async () => {
      if (!userId || !dateTime) {
        return null;
      }

      return await checkUserAvailability(userId, {
        dateTime,
        duration,
      });
    },
    [userId, dateTime, duration]
  );

  return useQuery<UserAvailabilityResponse | null, Error>({
    queryKey,
    queryFn,
    ...options,
  });
}
