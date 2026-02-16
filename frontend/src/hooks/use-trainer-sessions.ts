// React
import { useQuery } from "@tanstack/react-query";

// Hooks
import { useFrontendPagination } from "./use-frontend-pagination";

// Services
import { fetchTrainerSessions } from "@/services/session.api";

// Types
import type { ISession } from "@shared/interfaces/session.interface";
import type { TQueryParams } from "@shared/types/api/param.type";

interface IUseTrainerSessionsParams {
  trainerId: string;
  params?: TQueryParams & {
    limit?: number;
  };
}

/**
 * Hook to fetch trainer sessions with frontend pagination
 */
export function useTrainerSessions({ trainerId, params }: IUseTrainerSessionsParams, paginationLimit: number = 3) {
  // Fetch all sessions (no limit from backend for pagination)
  const { data: sessions, isLoading, ...rest } = useQuery<ISession[]>({
    queryKey: ["trainer-recent-sessions", trainerId, params],
    queryFn: () => fetchTrainerSessions(trainerId, params),
    enabled: !!trainerId,
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

