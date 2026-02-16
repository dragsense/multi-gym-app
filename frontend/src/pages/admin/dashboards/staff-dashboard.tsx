// External Libraries
import { useId } from "react";

// Layouts
import { PageInnerLayout } from "@/layouts";

// Dashboard Components
import {
  StaffWelcomeCard,
  StaffOutstandingBillingsCard,
  TrainerRecentSessionsCard,
  StaffQuickActionsCard,
} from "@/components/admin/dashboard";

export default function StaffDashboardPage() {
  return (
    <PageInnerLayout Header={<Header />}>
      <StaffDashboardView />
    </PageInnerLayout>
  );
}

function Header() {
  return null;
}

function StaffDashboardView() {
  const componentId = useId();

  return (
    <div className="space-y-6" data-component-id={componentId}>
      {/* Welcome Card with Live Time */}
      <StaffWelcomeCard />

      {/* Quick Actions */}
      <StaffQuickActionsCard />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StaffOutstandingBillingsCard />
        <TrainerRecentSessionsCard />
      </div>
    </div>
  );
}
