import React, { memo } from 'react'
import { AppCard } from '@/components/layout-ui/app-card'
import { useI18n } from '@/hooks/use-i18n'
import { buildSentence } from '@/locales/translations'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { IRevenueAnalytics } from '@shared/interfaces/dashboard.interface'

interface TotalRevenueCardProps {
  data: IRevenueAnalytics & { period?: string | number } | null
  isLoading?: boolean
  error?: Error | null
}

function TotalRevenueCard({ data, isLoading, error }: TotalRevenueCardProps) {
  const { t } = useI18n();

  const chartData = React.useMemo(() => {
    if (!data?.timeline) return [];
    return data.timeline.map(item => ({
      period: item.period,
      total: item.total || 0,
      sessionRevenue: item.sessionRevenue || 0,
      membershipRevenue: item.membershipRevenue || 0,
      posRevenue: item.posRevenue || 0,
      signupRevenue: item.signupRevenue || 0,
      customRevenue: item.customRevenue || 0,
    }));
  }, [data?.timeline]);

  // Format currency for tooltip (values are in dollars)
  const formatCurrency = (value: number | undefined | null) => {
    const numValue = typeof value === 'number' ? value : 0;
    return `$${numValue.toFixed(2)}`;
  };

  const currencyFormatter = (value: number) => {
    const absValue = Math.abs(value);

    if (absValue >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <AppCard>
        <div className="p-4">
          <div className="animate-pulse h-[35vh] bg-gray-200 rounded" />
        </div>
      </AppCard>
    );
  }

  if (error) {
    return (
      <AppCard>
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'revenue', 'data')}</div>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium">{t('Total Revenue')}</h3>
        </div>
        <div className="h-[35vh] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} height="100%" width="100%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (!value) return '';
                  const date = new Date(value);
                  // Access period from data prop
                  const period = (data as any)?.period?.toString().toLowerCase() || '';

                  if (period.includes('year')) {
                    return date.getUTCFullYear().toString();
                  } else if (period.includes('month')) {
                    return date.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
                  } else if (period.includes('week')) {
                    return date.toLocaleString('default', { day: '2-digit', month: 'short', timeZone: 'UTC' });
                  } else {
                    return date.toLocaleString('default', { day: '2-digit', month: 'short', timeZone: 'UTC' });
                  }
                }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={currencyFormatter}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => {
                  if (!label) return '';
                  const date = new Date(label);
                  if (isNaN(date.getTime())) return label;
                  const period = (data as any)?.period?.toString().toLowerCase() || '';

                  if (period.includes('year')) {
                    return date.getUTCFullYear().toString();
                  } else if (period.includes('month')) {
                    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                  } else if (period.includes('week')) {
                    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
                  } else {
                    return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
                  }
                }}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '6px', color: '#fff' }}
              />
              <Legend />
              {/* Bar charts for revenue breakdown */}
              <Bar
                dataKey="membershipRevenue"
                fill="#ef4444"
                name={buildSentence(t, 'Memberships')}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="sessionRevenue"
                fill="#f97316"
                name={buildSentence(t, 'Sessions')}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="posRevenue"
                fill="#eab308"
                name={buildSentence(t, 'POS')}
                radius={[0, 0, 0, 0]}


              />
              {/* Line chart for total revenue trend */}
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                name={buildSentence(t, 'Total', 'Revenue')}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppCard>
  )
}

export default memo(TotalRevenueCard)
