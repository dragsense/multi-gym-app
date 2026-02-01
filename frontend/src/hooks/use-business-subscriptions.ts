// React
import { useQuery } from "@tanstack/react-query";

// Services
import { fetchBusinessSubscriptions } from "@/services/business/business-subscription.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { BusinessSubscriptionDto } from "@shared/dtos";

interface IUseBusinessSubscriptionsParams {
  businessId: string;
  params?: IListQueryParams;
  enabled?: boolean;
}

/**
 * Hook to fetch business subscriptions for a specific business
 */
export function useBusinessSubscriptions({ 
  businessId, 
  params,
  enabled = true 
}: IUseBusinessSubscriptionsParams) {
  return useQuery<BusinessSubscriptionDto[]>({
    queryKey: ["business-subscriptions", businessId, params],
    queryFn: () => fetchBusinessSubscriptions(businessId, params),
    enabled: !!businessId && enabled,
  });
}
