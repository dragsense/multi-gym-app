// React
import { useId } from "react";

// Types
import type { IUser } from "@shared/interfaces/user.interface";

// Components
import { RecentOutstandingBillingSummaryCard as SharedRecentOutstandingBillingSummaryCard } from "@/components/shared-ui/recent-outstanding-billings-summary-card";
interface IRecentOutstandingBillingSummaryCardProps {
  user: IUser;
}

// Re-export the member version since it works with user
export function RecentOutstandingBillingSummaryCard({ user }: IRecentOutstandingBillingSummaryCardProps) {
  return <SharedRecentOutstandingBillingSummaryCard user={user} />;
}

