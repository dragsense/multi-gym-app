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
} from "recharts"


interface MembersGrowthCardProps {
  data: any & { period?: string | number }
  isLoading?: boolean
  error?: Error | null
}

function MembersGrowthCard({ data, isLoading, error }: MembersGrowthCardProps) {
  const { t } = useI18n();

  const series = React.useMemo(() => {
    return data?.series || [];
  }, [data?.series]);

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
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'membership', 'growth')}</div>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium">{t('Membership Growth')}</h3>
        </div>
        <div className="h-[35vh] p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (!value) return '';
                  // Try to parse as date if it's a date string
                  const date = new Date(value);
                  if (isNaN(date.getTime())) {
                    // If not a valid date, return as is
                    return value;
                  }
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
              <Line
                type="monotone"
                dataKey="total"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </AppCard>
  )
}

export default memo(MembersGrowthCard)
