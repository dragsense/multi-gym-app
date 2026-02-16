import { useMemo } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getAvailableSlots, getAvailableDates } from "@/services/session.api";

export interface UseAvailableDatesParams {
  trainerId?: string;
  memberIds?: string[];
  enabled?: boolean;
}

export interface UseAvailableSlotsParams {
  trainerId?: string;
  memberIds?: string[];
  date?: string;
  enabled?: boolean;
}

export interface UnavailableDateRange {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface AvailableDatesResponse {
  offDays: string[];
  unavailableRanges: UnavailableDateRange[];
}

export interface AvailableSlotsResponse {
  slots: Array<{ startTime: string; endTime: string }>;
  date: string;
}

/**
 * Hook to fetch available dates for a trainer and members
 */
export function useAvailableDates(
  params: UseAvailableDatesParams,
  options?: Omit<UseQueryOptions<AvailableDatesResponse, Error>, "queryKey" | "queryFn">
) {
  const {
    trainerId,
    memberIds,
    enabled = true,
  } = params;

  // React 19: Memoized query key for better performance
  const queryKey = useMemo(
    () => ['available-dates', trainerId, memberIds],
    [trainerId, memberIds]
  );

  // React 19: Memoized query function for better performance
  const queryFn = useMemo(
    () => async () => {
      if (!trainerId || !memberIds?.length) {
        return null;
      }

      return await getAvailableDates({
        trainerId,
        memberIds,
      });
    },
    [trainerId, memberIds]
  );

  return useQuery<AvailableDatesResponse | null, Error>({
    queryKey,
    queryFn,
    enabled: enabled && !!trainerId && !!memberIds?.length,
    ...options,
  });
}

/**
 * Hook to fetch available time slots for a specific date
 */
export function useAvailableSlots(
  params: UseAvailableSlotsParams,
  options?: Omit<UseQueryOptions<AvailableSlotsResponse | null, Error>, "queryKey" | "queryFn">
) {
  const {
    trainerId,
    memberIds,
    date,
    enabled = true,
  } = params;

  // React 19: Memoized query key for better performance
  const queryKey = useMemo(
    () => ['available-slots', trainerId, memberIds, date],
    [trainerId, memberIds, date]
  );

  // React 19: Memoized query function for better performance
  const queryFn = useMemo(
    () => async () => {
      if (!trainerId || !memberIds?.length || !date) {
        return null;
      }

      return await getAvailableSlots({
        trainerId,
        memberIds,
        date,
      });
    },
    [trainerId, memberIds, date]
  );

  return useQuery<AvailableSlotsResponse | null, Error>({
    queryKey,
    queryFn,
    enabled: enabled && !!trainerId && !!memberIds?.length && !!date,
    ...options,
  });
}

