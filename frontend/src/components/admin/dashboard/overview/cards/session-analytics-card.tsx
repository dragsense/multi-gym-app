import React from 'react';
import { AppCard } from '@/components/layout-ui/app-card';
import type { ISessionsAnalytics } from '@shared/interfaces/dashboard.interface';
import { useUserSettings } from '@/hooks/use-user-settings';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';
import { buildSentence } from '@/locales/translations';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface ISessionsAnalyticsCardProps {
  data: ISessionsAnalytics | null;
  loading?: boolean;
  dynamicDateLabel?: string;
}

export const SessionsAnalyticsCard: React.FC<ISessionsAnalyticsCardProps> = ({ data, loading = false, dynamicDateLabel }) => {
  const { settings } = useUserSettings();
  const { t } = useI18n();
  
  if (!loading && (!data || !data.timeline)) {
    return null;
  }


  // Colors for session types in charts
  const COLORS = {
    totalSessions: '#C6FF00',
    completedSessions: '#81fdad',
    scheduledSessions: '#00c2ff',
    cancelledSessions: '#FFE2E5',
  };

  // Tooltip formatter for currency and numbers
  const tooltipFormatter = (value: number, name: string) => {
    if (name.toLowerCase().includes('price') || name.toLowerCase().includes('revenue')) {
      return formatCurrency(value, undefined, undefined, 2, 2, settings);
    }
    return value;
  };

  return (
    <AppCard
      header={
        <div className="flex flex-wrap items-start justify-between">
          <h3 className="text-md font-semibold">{buildSentence(t, 'sessions', 'analytics')}</h3>
          <p className="text-xs text-muted-foreground">{dynamicDateLabel}</p>
        </div>

      }
      loading={loading}
      className="col-span-full hover:shadow-md transition-shadow"
    >
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
        {/* Timeline Line Chart */}
        <div className="border rounded-lg p-1 h-100">
          <ResponsiveContainer width="100%" >
            <LineChart data={data?.timeline}>
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={tooltipFormatter} />

              <Line
                type="monotone"
                dataKey="totalSessions"
                stroke={COLORS.totalSessions}
                strokeWidth={2}
                activeDot={{ r: 6 }}
                name={buildSentence(t, 'total', 'sessions')}
              />
              <Line
                type="monotone"
                dataKey="completedSessions"
                stroke={COLORS.completedSessions}
                strokeWidth={2}
                name={t('completed')}
              />
              <Line
                type="monotone"
                dataKey="scheduledSessions"
                stroke={COLORS.scheduledSessions}
                strokeWidth={2}
                name={t('scheduled')}
              />
              <Line
                type="monotone"
                dataKey="cancelledSessions"
                stroke={COLORS.cancelledSessions}
                strokeWidth={2}
                name={t('cancelled')}
              />
              <Legend verticalAlign="top" height={36} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4">
          <StatCard
            title={buildSentence(t, 'total', 'potential', 'revenue')}
            value={data?.timeline.reduce((acc, item) => acc + item.totalPotentialRevenue / 100, 0) || 0}
            isCurrency
          />
          <StatCard
            title={buildSentence(t, 'average', 'completion', 'rate')}
            value={
              data?.timeline.length
                ? data.timeline.reduce((acc, item) => acc + item.completionRate, 0) / data.timeline.length
                : 0
            }
            isPercentage
          />
          <StatCard
            title={buildSentence(t, 'average', 'session', 'price')}
            value={
              data?.timeline.length
                ? data.timeline.reduce((acc, item) => acc + item.averagePrice / 100, 0) / data.timeline.length
                : 0
            }
            isCurrency
          />
        </div>


      </div>

      {/* Session Types Breakdown */}
      {data && data.sessionTypes && (
        <div className="border rounded-lg p-1 mt-2">
          <h5 className="font-normal mb-4 text-sm">{buildSentence(t, 'session', 'types', 'breakdown')}</h5>
          {(!data.sessionTypes || data.sessionTypes.length === 0) && (
            <p className="text-sm text-muted-foreground">{buildSentence(t, 'no', 'session', 'types', 'data')}.</p>
          )}
          {data.sessionTypes && data.sessionTypes.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={data.sessionTypes}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="type"
                  type="category"
                  tick={{ fontSize: 14 }}
                  width={120}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'averagePrice') {
                      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
                    }
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#C6FF00" name={t('count')} />
                <Bar dataKey="averagePrice" fill="#00c2ff" name={buildSentence(t, 'avg', 'price')}>
                  {/* Optional: Different colors per bar */}
                  {data.sessionTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#00c2ff" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </AppCard>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  isPercentage?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, isCurrency, isPercentage }) => {
  const formattedValue = isCurrency
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
    : isPercentage
      ? `${value.toFixed(1)}%`
      : value;

  return (
    <AppCard
      header={
        <h3 className="text-sm text-muted-foreground font-medium">{title}</h3>
      }

    >
      <p className="text-3xl font-bold">{formattedValue}</p>
    </AppCard>

  );
};
