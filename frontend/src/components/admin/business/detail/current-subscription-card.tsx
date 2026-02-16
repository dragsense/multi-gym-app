// Types
import type { IBusiness } from "@shared/interfaces";
import { ESubscriptionStatus } from "@shared/enums";

// Hooks
import { useCurrentBusinessSubscriptionSummary } from "@/hooks/use-current-business-subscription-summary";

// Components
import { CurrentPlanSummaryCard, type IPlanSummaryDetail } from "@/components/shared-ui/current-plan-summary-card";
import { Calendar, DollarSign } from "lucide-react";

interface ICurrentSubscriptionCardProps {
    business: IBusiness;
}

export function CurrentSubscriptionCard({ business }: ICurrentSubscriptionCardProps) {
    // Fetch current subscription summary
    const { data: summary, isLoading } = useCurrentBusinessSubscriptionSummary({
        businessId: business.id,
    });

    const hasActiveSubscription = summary?.status === ESubscriptionStatus.ACTIVE;

    // Build details array
    const details: IPlanSummaryDetail[] = [];

    if (summary?.price !== null && summary?.price !== undefined) {
        details.push({
            icon: DollarSign,
            label: "Price",
            value: `$${Number(summary.price).toFixed(2)}`,
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
            isActive={hasActiveSubscription}
            color={summary?.color}
            details={details}
            emptyMessage="No active subscription"
            isLoading={isLoading}
        />
    );
}
