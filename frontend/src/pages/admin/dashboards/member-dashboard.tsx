// External Libraries
import { useId } from "react";

// Layouts
import { PageInnerLayout } from "@/layouts";

// Dashboard Components (use hooks directly, no props needed)
import { MyMembershipCard, MyOutstandingBillingsCard, MyUpcomingSessionsCard } from "@/components/admin/dashboard";

// Page Components (handle data fetching)
import { AdvertisementsBannerHandler } from "@/page-components/member-dashboard";

export default function MemberDashboardPage() {
  return (
    <PageInnerLayout Header={<Header />}>
      <MemberDashboardView />
    </PageInnerLayout>
  );
}

function Header() {
  return null;
}

function MemberDashboardView() {
  const componentId = useId();

  return (
    <div className="space-y-6" data-component-id={componentId}>
      {/* Advertisements Banner Section */}
      <AdvertisementsBannerHandler />

      {/* Member Overview Cards - using hooks directly */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MyMembershipCard />
        <MyOutstandingBillingsCard />
        <MyUpcomingSessionsCard />
      </div>
    </div>
  );
}
