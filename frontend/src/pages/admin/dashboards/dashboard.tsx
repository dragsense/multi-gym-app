import { EAnalyticsPeriod } from "@shared/enums/dashboard-analytics.enum";
import { SingleHandler } from '@/handlers';
import { DashboardControls, DashboardView, type IExtraProps } from "@/components/admin";
import { PageInnerLayout } from "@/layouts";
import { type ICombinedDashboardData } from "@/services/dashboard.api";
import { 
  fetchDashboardStats,
  fetchSessionsAnalytics,
  fetchBillingAnalytics,
  fetchMembersAnalytics,
  fetchMembershipsAnalytics,
  fetchCheckinsAnalytics
} from "@/services/dashboard.api";
import { getSelectedLocation } from "@/utils/location-storage";

// Stores
import type { TSingleHandlerStore } from "@/stores";
import type { DateRange } from "react-day-picker";

// Helper to calculate default date range based on period
const getDefaultDateRangeForPeriod = (period: EAnalyticsPeriod): { from: Date; to: Date } => {
  const now = new Date();
  const to = new Date(now);
  let from: Date;

  switch (period) {
    case EAnalyticsPeriod.YEAR:
      from = new Date(now);
      from.setFullYear(from.getFullYear() - 5);
      break;
    case EAnalyticsPeriod.MONTH:
      from = new Date(now);
      from.setMonth(from.getMonth() - 11);
      from.setDate(1);
      break;
    case EAnalyticsPeriod.WEEK:
      from = new Date(now);
      from.setDate(from.getDate() - 14);
      break;
    case EAnalyticsPeriod.DAY:
    default:
      from = new Date(now);
      from.setDate(from.getDate() - 5);
      break;
  }
  return { from, to };
};

// HELPER: Read initial state from URL
const getInitialParamsFromURL = () => {
  if (typeof window === 'undefined') return null;
  const searchParams = new URLSearchParams(window.location.search);
  const period = (searchParams.get('period') as EAnalyticsPeriod) || EAnalyticsPeriod.MONTH;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let customRange: DateRange | undefined = undefined;
  if (from) {
    customRange = {
      from: new Date(from),
      to: to ? new Date(to) : undefined
    };
  }
  return { period, customRange };
};

export default function DashboardPage() {
  const urlParams = getInitialParamsFromURL();

  return (
    <SingleHandler<ICombinedDashboardData, IExtraProps>
      queryFn={async (_id, queryParams) => {
        const params: Record<string, string | undefined> = {};
        const period = queryParams?.period as EAnalyticsPeriod || EAnalyticsPeriod.MONTH;
        params.period = period;

        const customRange = queryParams?.customRange as { from?: Date; to?: Date } | undefined;

        if (customRange?.from || customRange?.to) {
          if (customRange.from) params.from = customRange.from.toISOString().split("T")[0];
          if (customRange.to) params.to = customRange.to.toISOString().split("T")[0];
        } else {
          const defaultRange = getDefaultDateRangeForPeriod(period);
          params.from = defaultRange.from.toISOString().split("T")[0];
          params.to = defaultRange.to.toISOString().split("T")[0];
        }

        const location = getSelectedLocation();
        if (location) {
          params.locationId = location.id;
        }

        // Fetch all dashboard data in parallel
        const [
          stats,
          sessionsAnalytics,
          billingAnalytics,
          membersAnalytics,
          membershipsAnalytics,
          checkinsAnalytics
        ] = await Promise.all([
          fetchDashboardStats(params),
          fetchSessionsAnalytics(params),
          fetchBillingAnalytics(params),
          fetchMembersAnalytics(params),
          fetchMembershipsAnalytics(params),
          fetchCheckinsAnalytics(params),
        ]);

        return {
          stats,
          sessionsAnalytics,
          billingAnalytics,
          membersAnalytics,
          membershipsAnalytics,
          checkinsAnalytics,
        };
      }}
      storeKey="dashboardOverview"
      enabled={true}
      SingleComponent={({ storeKey, store }) => {
        if (!store) return <div>Dashboard store "{storeKey}" not found.</div>;
        return (
          <PageInnerLayout Header={<Header store={store} />}>
            <DashboardView storeKey={storeKey} store={store} />
          </PageInnerLayout>
        );
      }}
      // Use URL values for initial load to prevent resetting to Monthly on refresh
      initialParams={{
        period: EAnalyticsPeriod.MONTH,
        customRange: undefined
      }}
      singleProps={{
        period: EAnalyticsPeriod.MONTH,
        customRange: undefined
      }}
    />
  );
}

interface HeaderProps {
  store: TSingleHandlerStore<ICombinedDashboardData, IExtraProps>;
}

const Header = ({ store }: HeaderProps) => (
  <DashboardControls store={store} />
);
