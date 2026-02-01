import React from 'react';
import { type TSingleHandlerStore } from '@/stores';
import { Loader2 } from 'lucide-react';
import type { IPlatformOwnerDashboardStats } from '@shared/interfaces/platform-owner-dashboard.interface';
import type { DateRange } from 'react-day-picker';
import { PlatformOwnerDashboardOverview } from './platform-owner-dashboard-overview';
import { PlatformOwnerDashboardCharts } from './platform-owner-dashboard-charts';
import { useI18n } from '@/hooks/use-i18n';

export interface IPlatformOwnerDashboardExtraProps {
  customRange?: DateRange
}

interface IPlatformOwnerDashboardViewProps {
  storeKey: string;
  store: TSingleHandlerStore<IPlatformOwnerDashboardStats, IPlatformOwnerDashboardExtraProps>
}

export const PlatformOwnerDashboardView: React.FC<IPlatformOwnerDashboardViewProps> = ({ storeKey, store }) => {
  if (!store) {
    return <div>Dashboard store "{storeKey}" not found. Did you forget to register it?</div>;
  }

  const isLoading = store((state) => state.isLoading);
  const data = store((state) => state.response);
  const error = store((state) => state.error);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  const { t } = useI18n();
  const dateRange = data?.dateRange;

  const formatDateRange = (from: string, to: string) => {
    if (!from || !to) return '';
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const formattedFrom = fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTo = toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${formattedFrom} - ${formattedTo}`;
  };

  return (
    <div className="space-y-6">
      {dateRange && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {dateRange.isDefault ? (
              <>
                <span className="text-sm font-medium">{t('showingLast30Days')}</span>
                <span className="text-sm text-muted-foreground">({formatDateRange(dateRange.from, dateRange.to)})</span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium">{t('showingSelectedRange')}</span>
                <span className="text-sm text-muted-foreground">({formatDateRange(dateRange.from, dateRange.to)})</span>
              </>
            )}
          </div>
        </div>
      )}
      <PlatformOwnerDashboardOverview data={data} />
      <PlatformOwnerDashboardCharts data={data} />
    </div>
  );
};
