// React
import { useQuery } from "@tanstack/react-query";
import { useFrontendPagination } from "./use-frontend-pagination";

// Services
import { fetchAllMemberMembershipHistory } from "@/services/member-membership.api";

// Types
import type { IMemberMembershipHistory } from "@shared/interfaces/member-membership.interface";

interface IUseAllMemberMembershipHistoryParams {
  memberId: string;
  enabled?: boolean;
  initialLimit?: number;
}

/**
 * Hook to fetch all membership history for a member with frontend pagination
 * Aggregates histories from all memberships of the member
 */
export function useAllMemberMembershipHistory({
  memberId,
  enabled = true,
  initialLimit = 10,
}: IUseAllMemberMembershipHistoryParams) {
  // Fetch all history data
  const query = useQuery<IMemberMembershipHistory[]>({
    queryKey: ["all-member-membership-history", memberId],
    queryFn: () => fetchAllMemberMembershipHistory(memberId),
    enabled: !!memberId && enabled,
  });

  // Apply frontend pagination
  const {
    paginatedData,
    pagination,
    setPage,
    setLimit,
  } = useFrontendPagination<IMemberMembershipHistory>(
    query.data,
    initialLimit
  );

  return {
    ...query,
    data: paginatedData,
    allData: query.data,
    pagination,
    setPage,
    setLimit,
  };
}

