// React
import { useTransition, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Types
import type { ISubscription } from "@shared/interfaces";
import { ESubscriptionFrequency } from "@shared/enums";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { StepNavigationButtons } from "@/components/business-onboarding";
import { SubscriptionSelect } from "@/components/business-onboarding";

// Hooks
import { useSearchableSubscriptions } from "@/hooks/use-searchable";
import { useI18n } from "@/hooks/use-i18n";

interface ISelectedSubscription {
  plan: ISubscription;
  frequency: ESubscriptionFrequency;
}

interface ISubscriptionStepProps {
  onComplete: (subscription: ISelectedSubscription) => void;
  onBack?: () => void;
  selectedSubscription?: ISelectedSubscription | null;
}

export function SubscriptionStep({ onComplete, onBack, selectedSubscription }: ISubscriptionStepProps) {
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const [selected, setSelected] = useState<ISelectedSubscription | null>(selectedSubscription || null);

  // Fetch active subscriptions
  const { response: subscriptionsData, isLoading } = useSearchableSubscriptions({
    initialParams: { page: 1, limit: 100 },
  });

  const subscriptions = subscriptionsData?.data || [];

  useEffect(() => {
    if (selectedSubscription) {
      setSelected(selectedSubscription);
    }
  }, [selectedSubscription]);

  const handleContinue = () => {
    if (selected) {
      startTransition(() => {
        onComplete(selected);
      });
    }
  };

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
    <div className="space-y-6">
      <AppCard footer={
        <StepNavigationButtons
          onBack={onBack}
          onContinue={handleContinue}
          continueDisabled={!selected}
          showBack={!!onBack}
        />
      }>
        <p className="text-sm text-muted-foreground mb-5">
          Choose the subscription plan that best fits your business needs
        </p>

        {subscriptions.length === 0 ? (
          <AppCard>
            <div className="text-center py-12">
              <p className="text-muted-foreground">No subscriptions available at this time.</p>
            </div>
          </AppCard>
        ) : (
          <SubscriptionSelect
            value={selected || undefined}
            onChange={(value) => setSelected(value)}
            disabled={false}
            subscriptions={subscriptions}
          />
        )}
      </AppCard>
    </div>
  );
}
