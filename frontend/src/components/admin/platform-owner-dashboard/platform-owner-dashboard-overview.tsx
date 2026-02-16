import React from 'react';
import { AppCard } from '@/components/layout-ui/app-card';
import { formatCurrency } from '@/lib/utils';
import type { IPlatformOwnerDashboardStats } from '@shared/interfaces/platform-owner-dashboard.interface';
import { useI18n } from '@/hooks/use-i18n';
import { buildSentence } from '@/locales/translations';

interface IPlatformOwnerDashboardOverviewProps {
  data: IPlatformOwnerDashboardStats | null;
}



export const PlatformOwnerDashboardOverview: React.FC<IPlatformOwnerDashboardOverviewProps> = ({ data }) => {
  const { t } = useI18n();
  const overview = data?.overview;

  const stats = [
    {
      title: buildSentence(t, 'active', 'businesses'),
      value: overview?.activeBusinesses || 0,
      description: t('inDateRange'),
    },
    {
      title: buildSentence(t, 'total', 'revenue'),
      value: formatCurrency(overview?.totalRevenue || 0),
      description: t('fromPaidSubscriptions'),
    },
  ];


  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <AppCard key={index} className="hover:shadow-md transition-shadow">
            <div className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  );
};
