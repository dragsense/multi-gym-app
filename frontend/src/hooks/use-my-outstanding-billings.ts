// React
import { useQuery } from "@tanstack/react-query";

// Hooks
import { useFrontendPagination } from "./use-frontend-pagination";

// Services
import { fetchMyOutstandingBillingSummary } from "@/services/billing.api";

// Types
import type { IBilling } from "@shared/interfaces/billing.interface";

interface IOutstandingBillingSummaryResponse {
  recentBillings: IBilling[];
  totalOutstanding: number;
  totalOutstandingCount: number;
}

/**
 * Hook to fetch outstanding billing summary for the current logged-in member
 * Uses /billings/me/outstanding endpoint - no member ID needed
 * Returns recent billings, total outstanding amount, and total count
 * Supports frontend pagination
 */
export function useMyOutstandingBillings(paginationLimit: number = 5) {
  // Fetch all billings using "me" endpoint (no member ID needed)
  const { data, isLoading, ...rest } = useQuery<IOutstandingBillingSummaryResponse>({
    queryKey: ["my-outstanding-billings"],
    queryFn: () => fetchMyOutstandingBillingSummary({ limit: 100 }),
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
