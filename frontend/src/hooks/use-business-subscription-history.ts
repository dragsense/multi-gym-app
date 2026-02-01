// React
import { useQuery } from "@tanstack/react-query";

// Services
import { fetchBusinessSubscriptionHistory } from "@/services/business/business-subscription.api";

// Types
import type { BusinessSubscriptionHistoryDto } from "@shared/dtos";

interface IUseBusinessSubscriptionHistoryParams {
  businessSubscriptionId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch subscription history for a specific business subscription
 */
export function useBusinessSubscriptionHistory({ 
  businessSubscriptionId,
  enabled = true 
}: IUseBusinessSubscriptionHistoryParams) {
  return useQuery<BusinessSubscriptionHistoryDto[]>({
    queryKey: ["business-subscription-history", businessSubscriptionId],
    queryFn: () => fetchBusinessSubscriptionHistory(businessSubscriptionId, { _limit: 100 }),
    enabled: !!businessSubscriptionId && enabled,
  });
}
