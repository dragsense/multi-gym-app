import React, { useMemo, memo } from 'react'
import { AppCard } from '@/components/layout-ui/app-card'
import { useI18n } from '@/hooks/use-i18n'
import { buildSentence } from '@/locales/translations'
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface MembersSubscriptionsCardProps {
  data: any
  isLoading?: boolean
  error?: Error | null
}

function MembersSubscriptionsCard({ data, isLoading, error }: MembersSubscriptionsCardProps) {
  const { t } = useI18n();

  // Use membership types from data
  const membershipTypes = useMemo(() => {
    return data?.membershipTypes || [];
  }, [data?.membershipTypes])

  // Calculate total and add percentage to each entry
  const membershipTypesWithPercentage = useMemo(() => {
    const total = membershipTypes.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
    return membershipTypes.map((item: any) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));
  }, [membershipTypes])

  // Check if we have any non-zero counts for rendering the pie chart
  const hasNonZeroCounts = useMemo(() => {
    return membershipTypesWithPercentage.some((item: any) => (item.count || 0) > 0);
  }, [membershipTypesWithPercentage])

  // Theme colors matching the design system (using actual HSL values)
  const COLORS = React.useMemo(() => [
    'hsl(0, 84%, 60%)',
    'hsl(0, 84%, 90%)',
    'hsl(0, 84%, 80%)',
    'hsl(0, 84%, 70%)',
  ], []);

  // Custom label function to show percentage inside slices
  const renderCustomLabel = React.useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if slice is large enough (> 5%)
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  }, []);

  if (isLoading) {
    return (
      <AppCard>
        <div className="p-4">
          <div className="animate-pulse h-36 bg-gray-200 rounded-full" />
        </div>
      </AppCard>
    );
  }

  if (error) {
    return (
      <AppCard>
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'memberships')}</div>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium">{buildSentence(t, 'memberships')}</h3>
        </div>

        {/* Membership Types Breakdown */}
        {membershipTypesWithPercentage && membershipTypesWithPercentage.length > 0 ? (
          <div className="border rounded-lg ">
            {hasNonZeroCounts ? (
              <div className="h-[30vh]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={membershipTypesWithPercentage.filter((item: any) => (item.count || 0) > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="type"
                    >
                      {membershipTypesWithPercentage
                        .filter((item: any) => (item.count || 0) > 0)
                        .map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${props.payload.type}: ${value} (${props.payload.percentage}%)`,
                      ]}
                    />
                    <Legend
                      formatter={(value: string, entry: any) => {
                        const item = membershipTypesWithPercentage.find((item: any) => item.type === value);
                        const percentage = item?.percentage || 0;
                        const count = item?.count || 0;
                        return (
                          <span className="text-sm text-muted-foreground">
                            {value} ({count} - {percentage}%)
                          </span>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[30vh] flex flex-col items-center justify-center">
                <div className="mb-4 flex items-center justify-center">
                  <div
                    className="rounded-full border-4 border-gray-200 flex items-center justify-center"
                    style={{
                      width: '128px',
                      height: '128px',
                      minWidth: '128px',
                      minHeight: '128px'
                    }}
                  >
                    <span className="text-lg font-semibold text-muted-foreground">0</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center px-4">
                  {buildSentence(t, 'no', 'subscriptions', 'yet')}
                  <br />

                </p>
                {/* Show legend with all memberships even if count is 0 */}
                {membershipTypesWithPercentage.length > 0 && (
                  <div className="mt-4 w-full px-4">
                    <div className="flex flex-wrap gap-4 justify-center">
                      {membershipTypesWithPercentage.map((entry: any, index: number) => (
                        <div key={`legend-${index}`} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {entry.type} ({entry.count || 0} - {entry.percentage || 0}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-44">
            <p className="text-sm text-muted-foreground">{buildSentence(t, 'no', 'membership', 'types', 'data')}.</p>
          </div>
        )}
      </div>
    </AppCard>
  )
}

export default memo(MembersSubscriptionsCard)
