// Hooks
import { useMyMembershipSummary } from "@/hooks/use-my-membership-summary";

// Components
import { CurrentPlanSummaryCard, formatBillingFrequency, type IPlanSummaryDetail } from "@/components/shared-ui/current-plan-summary-card";
import { Calendar, DollarSign, Clock, BadgeCheck } from "lucide-react";

/**
 * Card component that displays the current membership for the logged-in member
 * Uses useMyMembershipSummary hook directly - no props needed
 */
export function MyMembershipCard() {
  const { summary, isActive, isLoading } = useMyMembershipSummary();

  // Build details array
  const details: IPlanSummaryDetail[] = [];

  if (summary?.price !== null && summary?.price !== undefined) {
    details.push({
      icon: DollarSign,
      label: "Price",
      value: `$${summary.price.toFixed(2)}`,
      subValue: summary.billingFrequency ? `/ ${formatBillingFrequency(summary.billingFrequency)}` : undefined,
    });
  }

  if (summary?.billingFrequency) {
    details.push({
      icon: Clock,
      label: "Billing",
      value: formatBillingFrequency(summary.billingFrequency),
    });
  }

  if (summary?.startDate) {
    details.push({
      icon: Calendar,
      label: "Start Date",
      value: new Date(summary.startDate).toLocaleDateString(),
    });
  }

  if (summary?.endDate) {
    details.push({
      icon: Calendar,
      label: "End Date",
      value: new Date(summary.endDate).toLocaleDateString(),
    });
  }

  return (
    <CurrentPlanSummaryCard
      title="Current Membership"
      planName={summary?.membershipName}
      description={summary?.membershipDescription}
      status={summary?.status}
      isActive={isActive}
      color={summary?.color}
      details={details}
      emptyMessage="No active membership"
      isLoading={isLoading}
      headerIcon={BadgeCheck}
    />
  );
}
