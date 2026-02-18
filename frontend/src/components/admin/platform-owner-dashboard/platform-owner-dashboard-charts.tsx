import React from 'react';
import { AppCard } from '@/components/layout-ui/app-card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import type { IPlatformOwnerDashboardStats } from '@shared/interfaces/platform-owner-dashboard.interface';
import { useI18n } from '@/hooks/use-i18n';

interface IPlatformOwnerDashboardChartsProps {
  data: IPlatformOwnerDashboardStats | null;
}


export const PlatformOwnerDashboardCharts: React.FC<IPlatformOwnerDashboardChartsProps> = ({ data }) => {
  const { t } = useI18n();
  const businessGrowth = data?.businessGrowth || [];
  const subscriptionDistribution = data?.subscriptionDistribution || [];

  const businessGrowthChartConfig = {
    businesses: {
      label: t('businesses'),
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const subscriptionChartConfig = {
    count: {
      label: t('count'),
      color: "hsl(var(--chart-1))",
    },
    revenue: {
      label: t('revenue'),
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig;

  // Generate colors for subscriptions (use subscription color if available, otherwise use default)
  const getSubscriptionColor = (index: number, subscriptionColor?: string) => {
    if (subscriptionColor) {
      return subscriptionColor;
    }
    // Default color palette fallback
    const defaultColors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ];
    return defaultColors[index % defaultColors.length];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
      {/* Business Growth Chart */}
      <AppCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{t('businessGrowth')}</h3>
        
        </div>
        <ChartContainer config={businessGrowthChartConfig} className="min-h-[300px] w-full">
          <LineChart data={businessGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis />
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value: number) => value}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                }}
              />} 
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line 
              type="monotone" 
              dataKey="businesses" 
              stroke="var(--color-businesses)" 
              strokeWidth={2}
              name={t('businesses')}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
        {businessGrowth.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No businesses created in this period
          </div>
        )}
      </AppCard>

      {/* Subscription Distribution */}
     {/*  <AppCard>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{t('subscriptionDistribution')}</h3>
          
        </div>
        <ChartContainer config={subscriptionChartConfig} className="min-h-[300px] w-full">
          <BarChart data={subscriptionDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="subscriptionTitle" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') {
                    return formatCurrency(value);
                  }
                  return value;
                }}
              />} 
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="count" name={t('count')}>
              {subscriptionDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getSubscriptionColor(index, entry.color)} />
              ))}
            </Bar>
            <Bar dataKey="revenue" fill="var(--color-revenue)" name={t('revenue')} />
          </BarChart>
        </ChartContainer>
        {subscriptionDistribution.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No subscriptions in this period
          </div>
        )}
      </AppCard> */}
    </div>
  );
};
