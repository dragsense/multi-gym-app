// React
import { useQuery } from "@tanstack/react-query";

// Services
import { fetchCurrentBusinessSubscription, fetchBusinessSubscriptionStatus } from "@/services/business/business-subscription.api";

// Types
import { ESubscriptionStatus } from "@shared/enums";

interface ICurrentBusinessSubscriptionSummary {
  status: ESubscriptionStatus | null;
  subscriptionName?: string;
  subscriptionDescription?: string;
  price?: number;
  activatedAt?: Date | null;
  color?: string;
}

interface IUseCurrentBusinessSubscriptionSummaryParams {
  businessId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch current business subscription summary
 */
export function useCurrentBusinessSubscriptionSummary({ 
  businessId, 
  enabled = true 
}: IUseCurrentBusinessSubscriptionSummaryParams) {
  const { data: businessSubscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["business-current-subscription", businessId],
    queryFn: () => fetchCurrentBusinessSubscription(businessId, {
      _relations: "subscription,business",
    }),
    enabled: !!businessId && enabled,
  });

  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["business-subscription-status", businessId],
    queryFn: () => fetchBusinessSubscriptionStatus(businessId),
    enabled: !!businessId && enabled,
  });

  const isLoading = isLoadingSubscription || isLoadingStatus;
  const subscriptionStatus = status?.status || ESubscriptionStatus.INACTIVE;

  const summary: ICurrentBusinessSubscriptionSummary | null = businessSubscription && businessSubscription.subscription
    ? {
        status: subscriptionStatus,
        subscriptionName: businessSubscription.subscription.title,
        subscriptionDescription: businessSubscription.subscription.description,
        price: businessSubscription.subscription.price != null ? Number(businessSubscription.subscription.price) : undefined,
        activatedAt: status?.activatedAt || null,
        color: businessSubscription.subscription.color,
      }
    : null;

  return {
    data: summary,
    isLoading,
  };
}
