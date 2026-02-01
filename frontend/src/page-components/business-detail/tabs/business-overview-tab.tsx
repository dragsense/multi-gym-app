// React
import { useId } from "react";

// Types
import type { IBusiness } from "@shared/interfaces";

// Components
import { CurrentSubscriptionCard, RecentOutstandingBillingSummaryCard } from "@/components/admin/business/detail";

interface IBusinessOverviewTabProps {
  business: IBusiness;
  storeKey: string;
}

export function BusinessOverviewTab({ business, storeKey }: IBusinessOverviewTabProps) {
  const componentId = useId();

  return (
    <div data-component-id={componentId} className="space-y-6">
      {/* Three cards in columns - same as member */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CurrentSubscriptionCard business={business} />
        {business.user && <RecentOutstandingBillingSummaryCard user={business.user} />}
      </div>
    </div>
  );
}
