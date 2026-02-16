// React
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";

// Hooks
import { useFrontendPagination } from "./use-frontend-pagination";

// Services
import { fetchMySessions } from "@/services/session.api";

// Types
import type { ISession } from "@shared/interfaces/session.interface";
import { ESessionStatus } from "@shared/enums/session.enum";

/**
 * Hook to fetch upcoming sessions for the current logged-in member
 * Uses /sessions/me/events endpoint - no member ID needed
 * Supports frontend pagination
 */
export function useMySessions(paginationLimit: number = 3) {
  // Default date range: today to 10 days from now
  const startDate = DateTime.now().startOf('day').toISO();
  const endDate = DateTime.now().plus({ days: 10 }).endOf('day').toISO();

  // Fetch sessions using "me" endpoint (no member ID needed)
  const { data: sessions, isLoading, ...rest } = useQuery<ISession[]>({
    queryKey: ["my-upcoming-sessions"],
    queryFn: () => fetchMySessions({
      startDate,
      endDate,
      statuses: [ESessionStatus.SCHEDULED, ESessionStatus.RESCHEDULED],
      limit: 100,
    }),
  });

  // Frontend pagination
  const { paginatedData, pagination, setPage, setLimit } = useFrontendPagination(sessions, paginationLimit);

  return {
    data: paginatedData,
    isLoading,
    pagination,
    setPage,
    setLimit,
    ...rest,
  };
}
