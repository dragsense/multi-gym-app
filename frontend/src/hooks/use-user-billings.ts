// React
import { useQuery } from "@tanstack/react-query";

// Hooks
import { useFrontendPagination } from "./use-frontend-pagination";

// Services
import { fetchOutstandingBillingSummary } from "@/services/billing.api";

// Types
import type { IBilling } from "@shared/interfaces/billing.interface";

interface IUseOutstandingBillingSummaryParams {
  userId: string;
  params?: {
    limit?: number;
  };
}

interface IOutstandingBillingSummaryResponse {
  recentBillings: IBilling[];
  totalOutstanding: number;
  totalOutstandingCount: number;
}

/**
 * Hook to fetch outstanding billing summary for a specific user
 * Returns recent billings, total outstanding amount, and total count
 * Supports frontend pagination
 */
export function useOutstandingBillingSummary({ userId, params }: IUseOutstandingBillingSummaryParams, paginationLimit: number = 5) {
  // Fetch all billings (no limit from backend)
  const { data, isLoading, ...rest } = useQuery<IOutstandingBillingSummaryResponse>({
    queryKey: ["user-outstanding-billings", userId],
    queryFn: () => fetchOutstandingBillingSummary(userId, params),
    enabled: !!userId,
  });

  // Frontend pagination
  const { paginatedData, pagination, setPage, setLimit } = useFrontendPagination(data?.recentBillings, paginationLimit);

  return {
    data: {
      recentBillings: paginatedData,
      totalOutstanding: data?.totalOutstanding || 0,
      totalOutstandingCount: data?.totalOutstandingCount || 0,
    },
    isLoading,
    pagination,
    setPage,
    setLimit,
    ...rest,
  };
}

