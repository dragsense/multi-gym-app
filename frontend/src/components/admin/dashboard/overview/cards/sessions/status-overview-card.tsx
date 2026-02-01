import React, { memo } from 'react'
import { AppCard } from '@/components/layout-ui/app-card'
import { useI18n } from '@/hooks/use-i18n'
import { buildSentence } from '@/locales/translations'
import type { ISessionsAnalytics } from '@shared/interfaces/dashboard.interface'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface StatusOverviewCardProps {
  data: ISessionsAnalytics | null
  isLoading?: boolean
  error?: Error | null
}

function StatusOverviewCard({ data, isLoading, error }: StatusOverviewCardProps) {
  const { t } = useI18n()

  const chartData = React.useMemo(() => {
    if (!data?.timeline) return []

    return data.timeline.map((item) => ({
      label: item.period,
      total: item.totalSessions ?? 0,
      completed: item.completedSessions ?? 0,
      scheduled: item.scheduledSessions ?? 0,
      cancelled: item.cancelledSessions ?? 0,
    }))
  }, [data?.timeline])

  const chartConfig: ChartConfig = React.useMemo(() => ({
    total: {
      label: buildSentence(t, 'total', 'sessions'),
      color: 'hsl(0, 0%, 20%)', // Dark grey/black
    },
    completed: {
      label: t('completed'),
      color: 'hsl(142, 76%, 36%)', // Green
    },
    scheduled: {
      label: t('scheduled'),
      color: 'hsl(217, 91%, 60%)', // Blue
    },
    cancelled: {
      label: t('cancelled'),
      color: 'hsl(0, 84%, 60%)', // Red
    },
  }), [t])

  if (isLoading) {
    return (
      <AppCard>
        <div className="p-4">
          <div className="animate-pulse h-[45vh] bg-gray-200 rounded" />
        </div>
      </AppCard>
    )
  }

  if (error) {
    return (
      <AppCard>
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'session', 'status', 'chart')}</div>
      </AppCard>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <AppCard>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{buildSentence(t, 'no', 'session', 'status', 'data')}.</p>
        </div>
      </AppCard>
    )
  }

  return (
    <AppCard>
      <div className="p-4 flex flex-col justify-between h-[45vh]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium">{buildSentence(t, 'session', 'status', 'overview')}</h3>
        </div>

        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
            barCategoryGap="20%"
            barGap={2}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="hsl(0, 0%, 90%)"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: 'hsl(0, 0%, 40%)', fontSize: 12 }}
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
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
              tick={{ fill: 'hsl(0, 0%, 40%)', fontSize: 12 }}
              domain={[0, (dataMax: number) => Math.ceil(dataMax * 2)]}
              allowDecimals={false}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: 'transparent' }}
            />
            <Bar
              dataKey="total"
              fill="var(--color-total)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="completed"
              fill="var(--color-completed)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="scheduled"
              fill="var(--color-scheduled)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="cancelled"
              fill="var(--color-cancelled)"
              radius={[0, 0, 0, 0]}
            />
            <ChartLegend
              verticalAlign="bottom"
              content={<ChartLegendContent />}
              wrapperStyle={{ paddingTop: '16px' }}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </AppCard>
  )
}

export default memo(StatusOverviewCard)
