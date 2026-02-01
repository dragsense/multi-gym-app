// React
import { useId, useMemo } from "react";

// Types
import type { IBusiness } from "@shared/interfaces";
import type { BusinessSubscriptionHistoryDto } from "@shared/dtos";

// Hooks
import { useBusinessSubscriptions } from "@/hooks/use-business-subscriptions";
import { useBusinessSubscriptionHistory } from "@/hooks/use-business-subscription-history";
import { useQueryClient } from "@tanstack/react-query";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { SubscriptionCard } from "@/components/shared-ui/subscription-card";
import { BusinessSubscriptionHistoryTimeline } from "@/components/admin/business/detail/business-subscription-history-timeline";
import { ESubscriptionFrequency } from "@shared/enums";

interface IBusinessSubscriptionTabProps {
  business: IBusiness;
  storeKey: string;
}

export function BusinessSubscriptionTab({ business, storeKey }: IBusinessSubscriptionTabProps) {
  const componentId = useId();
  const queryClient = useQueryClient();
  const SUBSCRIPTION_HISTORY_STORE_KEY = `${storeKey}-subscription-history`;

  // Fetch business subscriptions using hook
  const { data: businessSubscriptionsData, isLoading } = useBusinessSubscriptions({
    businessId: business.id,
    params: {
      _relations: "subscription",
    },
  });

  const businessSubscriptions = businessSubscriptionsData || [];

  if (isLoading) {
    return (
      <AppCard loading={true}>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading subscriptions...</p>
        </div>
      </AppCard>
    );
  }

  return (
    <div data-component-id={componentId} className="space-y-6">
      {/* Subscription Cards */}
      {businessSubscriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businessSubscriptions.map((businessSubscription: any) => (
            <SubscriptionCardWithStatus
              key={businessSubscription.id}
              businessSubscription={businessSubscription}
            />
          ))}
        </div>
      ) : (
        <AppCard>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No subscriptions found</p>
          </div>
        </AppCard>
      )}

      {/* Subscription History Timeline */}
      <BusinessSubscriptionHistoryTimeline business={business} initialLimit={10} />
    </div>
  );
}

// Component to fetch and display subscription with status
function SubscriptionCardWithStatus({ businessSubscription }: { businessSubscription: any }) {
  const { data: historyData } = useBusinessSubscriptionHistory({
    businessSubscriptionId: businessSubscription.id,
  });

  const history = historyData || [];
  const isActive = useMemo(() => {
    if (!history || history.length === 0) return false;
    const latestHistory = history[history.length - 1];
    return latestHistory?.status === 'ACTIVE';
  }, [history]);

  // Default to monthly frequency for display
  const frequency = ESubscriptionFrequency.MONTHLY;

  return (
    <SubscriptionCard
      subscription={businessSubscription.subscription}
      frequency={frequency}
      isSelected={isActive}
      showSelection={false}
    />
  );
}
