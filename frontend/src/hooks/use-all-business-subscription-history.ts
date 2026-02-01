// React
import { useQuery } from "@tanstack/react-query";

// Services
import { fetchAllBusinessSubscriptionHistory } from "@/services/business/business-subscription.api";

// Types
import type { BusinessSubscriptionHistoryDto } from "@shared/dtos";
import { useFrontendPagination } from "@/hooks/use-frontend-pagination";

interface IUseAllBusinessSubscriptionHistoryParams {
  businessId: string;
  enabled?: boolean;
  initialLimit?: number;
}

/**
 * Hook to fetch all subscription history for a business with frontend pagination
 * Aggregates histories from all subscriptions of the business
 */
export function useAllBusinessSubscriptionHistory({
  businessId,
  enabled = true,
  initialLimit = 10,
}: IUseAllBusinessSubscriptionHistoryParams) {
  // Fetch all history data
  const query = useQuery<BusinessSubscriptionHistoryDto[]>({
    queryKey: ["all-business-subscription-history", businessId],
    queryFn: () => fetchAllBusinessSubscriptionHistory(businessId),
    enabled: !!businessId && enabled,
  });

  // Apply frontend pagination
  const {
    paginatedData,
    pagination,
    setPage,
    setLimit,
  } = useFrontendPagination<BusinessSubscriptionHistoryDto>(
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
