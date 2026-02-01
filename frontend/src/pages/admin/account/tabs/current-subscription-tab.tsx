// Hooks
import { useMyBusinessSubscriptionSummary } from "@/hooks/use-my-business-subscription-summary";

// Components
import { CurrentPlanSummaryCard, formatBillingFrequency, type IPlanSummaryDetail } from "@/components/shared-ui/current-plan-summary-card";
import { Calendar, DollarSign, Clock } from "lucide-react";

export default function CurrentSubscriptionTab() {
  const { summary, isActive, isLoading } = useMyBusinessSubscriptionSummary();

  // Build details array
  const details: IPlanSummaryDetail[] = [];

  if (summary?.price !== null && summary?.price !== undefined) {
    details.push({
      icon: DollarSign,
      label: "Price",
      value: `$${Number(summary.price).toFixed(2)}`,
      subValue: summary.frequency ? `/ ${formatBillingFrequency(summary.frequency)}` : undefined,
    });
  }

  if (summary?.frequency) {
    details.push({
      icon: Clock,
      label: "Billing",
      value: formatBillingFrequency(summary.frequency),
    });
  }

  if (summary?.startDate) {
    details.push({
      icon: Calendar,
      label: "Start Date",
      value: new Date(summary.startDate).toLocaleDateString(),
    });
  }

  if (summary?.activatedAt) {
    details.push({
      icon: Calendar,
      label: "Activated",
      value: new Date(summary.activatedAt).toLocaleDateString(),
    });
  }

  return (
    <CurrentPlanSummaryCard
      title="Current Subscription"
      planName={summary?.subscriptionName}
      description={summary?.subscriptionDescription}
      status={summary?.status}
      isActive={isActive}
      color={summary?.color}
      details={details}
      emptyMessage="No active subscription"
      isLoading={isLoading}
    />
  );
}
