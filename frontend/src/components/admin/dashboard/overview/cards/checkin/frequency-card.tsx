import React, { memo } from 'react'
import { AppCard } from '@/components/layout-ui/app-card'
import { useI18n } from '@/hooks/use-i18n'
import { buildSentence } from '@/locales/translations'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { ICheckinAnalytics } from '@shared/interfaces/dashboard.interface'

interface FrequencyCardProps {
  data: ICheckinAnalytics & { period?: string | number } | null
  isLoading?: boolean
  error?: Error | null
}

function FrequencyCard({ data, isLoading, error }: FrequencyCardProps) {
  const { t } = useI18n();

  const chartData = React.useMemo(() => {
    if (!data?.timeline) return [];
    return data.timeline.map(item => ({
      label: item.period,
      attended: item.attended || 0,
      missed: item.missed || 0,
      total: item.total || 0,
    }));
  }, [data?.timeline]);

  if (isLoading) {
    return (
      <AppCard>
        <div className="p-4">
          <div className="animate-pulse h-36 bg-gray-200 rounded" />
        </div>
      </AppCard>
    );
  }

  if (error) {
    return (
      <AppCard>
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'checkin', 'frequency')}</div>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium">{t('Checkin Frequency')}</h3>
        </div>
        <div className="h-[35vh] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickFormatter={React.useCallback((value) => {
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
                }, [data?.period])}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
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
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="attended"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name={t('Attended')}
              />
              <Line
                type="monotone"
                dataKey="missed"
                stroke="#9ca3af"
                strokeWidth={2}
                dot={false}
                name={t('Missed')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppCard>
  )
}

export default memo(FrequencyCard)
