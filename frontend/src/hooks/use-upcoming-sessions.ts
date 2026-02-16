// React
import { useQuery } from "@tanstack/react-query";

// Hooks
import { useFrontendPagination } from "./use-frontend-pagination";

// Services
import { fetchCalendarEvents } from "@/services/session.api";

// Types
import type { ISession } from "@shared/interfaces/session.interface";
import type { TQueryParams } from "@shared/types/api/param.type";

interface IUseUpcomingSessionsParams {
  params?: TQueryParams & {
    limit?: number;
  };
}

/**
 * Hook to fetch upcoming sessions for dashboard with frontend pagination
 */
export function useUpcomingSessions({ params }: IUseUpcomingSessionsParams = {}, paginationLimit: number = 3) {
  // Fetch all sessions (no limit from backend for pagination)
  const { data: sessions, isLoading, ...rest } = useQuery<ISession[]>({
    queryKey: ["upcoming-sessions", params],
    queryFn: () => fetchCalendarEvents(params),
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

