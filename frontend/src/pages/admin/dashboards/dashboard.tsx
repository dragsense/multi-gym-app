import React from 'react';
import type { DateRange } from 'react-day-picker';

// Handlers
import { SingleHandler } from '@/handlers';

// Components
import { DashboardControls, DashboardView, type IExtraProps } from '@/components/admin';
import { PageInnerLayout } from '@/layouts';

// API
import { fetchCombinedDashboardData } from '@/services/dashboard.api';

// Types
import type { ICombinedDashboardData } from '@/@types/dashboard.type';
import type { TSingleHandlerStore } from '@/stores';

// Default to last 30 days
const getDefaultDateRange = (): DateRange => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 30);
  return { from, to };
};

const DashboardOverview: React.FC = () => {
  const defaultRange = getDefaultDateRange();

  return (
    <SingleHandler<ICombinedDashboardData, IExtraProps>
      queryFn={(_id, params) => {
        const range = (params?.dateRange as DateRange) || defaultRange;
        const apiParams: Record<string, string> = {};
        if (range?.from) {
          apiParams.from = range.from.toISOString().split('T')[0];
        }
        if (range?.to) {
          apiParams.to = range.to.toISOString().split('T')[0];
        }
        return fetchCombinedDashboardData(apiParams);
      }}
      storeKey="dashboardOverview"
      enabled={true}
      initialParams={{ dateRange: defaultRange }}
      singleProps={{ dateRange: defaultRange }}
      SingleComponent={({ storeKey, store }) => {
        if (!store) return <div>Dashboard store "{storeKey}" not found.</div>;
        return (
          <PageInnerLayout Header={<Header store={store} />}>
            <DashboardView storeKey={storeKey} store={store} />
          </PageInnerLayout>
        );
      }}
    />
  );
};

interface HeaderProps {
  store: TSingleHandlerStore<ICombinedDashboardData, IExtraProps>;
}

const Header = ({ store }: HeaderProps) => (
  <DashboardControls store={store} />
);

export default DashboardOverview;
