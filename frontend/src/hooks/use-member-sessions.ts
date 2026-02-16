// React
import { useQuery } from "@tanstack/react-query";

// Hooks
import { useFrontendPagination } from "./use-frontend-pagination";

// Services
import { fetchMemberSessions } from "@/services/session.api";

// Types
import type { ISession } from "@shared/interfaces/session.interface";
import type { TQueryParams } from "@shared/types/api/param.type";

interface IUseMemberSessionsParams {
  memberId: string;
  params?: TQueryParams & {
    limit?: number;
  };
}

/**
 * Hook to fetch member sessions with frontend pagination
 */
export function useMemberSessions({ memberId, params }: IUseMemberSessionsParams, paginationLimit: number = 3) {
  // Fetch all sessions (no limit from backend for pagination)
  const { data: sessions, isLoading, ...rest } = useQuery<ISession[]>({
    queryKey: ["member-recent-sessions", memberId, params],
    queryFn: () => fetchMemberSessions(memberId, params),
    enabled: !!memberId,
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

