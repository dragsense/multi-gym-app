import React, { memo, useCallback } from 'react'
import { AppCard } from '@/components/layout-ui/app-card'
import { useI18n } from '@/hooks/use-i18n'
import { buildSentence } from '@/locales/translations'
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

interface MembersChartCardProps {
  data: any & { period?: string | number }
  isLoading?: boolean
  error?: Error | null
}

function MembersChartCard({ data, isLoading, error }: MembersChartCardProps) {
  const { t } = useI18n()
  const series = data?.series || []



  const chartData = React.useMemo(() => {
    return series.map((s: any) => ({
      label: s.label,
      total: s.total ?? 0,
      active: s.active ?? 0,
      inactive: s.inactive ?? 0,
    }))
  }, [series])



  const chartConfig: ChartConfig = React.useMemo(() => ({
    total: {
      label: 'Total Members',
      color: 'hsl(0, 0%, 20%)', // Dark grey/black
    },
    active: {
      label: 'Active',
      color: 'hsl(0, 84%, 60%)', // Red
    },
    inactive: {
      label: 'inActive',
      color: 'hsl(0, 0.00%, 49.40%)', // gray
    },
  }), [])

  if (isLoading) {
    return (
      <AppCard>
        <div className="p-4">
          <div className="animate-pulse h-36 bg-gray-200 rounded" />
        </div>
      </AppCard>
    )
  }

  if (error) {
    return (
      <AppCard>
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'members', 'chart')}</div>
      </AppCard>
    )
  }

  return (
    <AppCard>
      <div className="p-4 flex flex-col justify-between h-[45vh] ">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium">{t('members')}</h3>
        </div>

        <ChartContainer config={chartConfig} className="h-full w-full ">
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
              axisLine={true}
              tickMargin={8}
              tick={{ fill: 'hsl(0, 0%, 40%)', fontSize: 12 }}
              tickFormatter={useCallback((value) => {
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
              tickLine={false}
              axisLine={true}
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
              dataKey="active"
              fill="var(--color-active)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="inactive"
              fill="var(--color-inactive)"
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

export default memo(MembersChartCard)
