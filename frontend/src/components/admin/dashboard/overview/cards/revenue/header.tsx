import React, { memo } from 'react'
import { AppCard } from '@/components/layout-ui/app-card'
import { DollarSign } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { buildSentence } from '@/locales/translations'
import type { IRevenueAnalytics } from '@shared/interfaces/dashboard.interface'

interface RevenueHeaderProps {
  data: IRevenueAnalytics | null
  isLoading?: boolean
  error?: Error | null
}

function RevenueHeader({ data, isLoading, error }: RevenueHeaderProps) {
  const { t } = useI18n();

  // Calculate totals from summary data
  const summary = React.useMemo(() => {
    if (!data?.summary) {
      return {
        totalRevenue: 0,
        fromMemberships: 0,
        fromPOS: 0,
        fromSessions: 0,
        fromSignups: 0,
        fromCustom: 0,
      };
    }

    // Ensure all values are numbers, defaulting to 0 if undefined/null
    return {
      totalRevenue: typeof data.summary.totalRevenue === 'number' ? data.summary.totalRevenue : 0,
      fromMemberships: typeof data.summary.fromMemberships === 'number' ? data.summary.fromMemberships : 0,
      fromPOS: typeof data.summary.fromPOS === 'number' ? data.summary.fromPOS : 0,
      fromSessions: typeof data.summary.fromSessions === 'number' ? data.summary.fromSessions : 0,
      fromSignups: typeof data.summary.fromSignups === 'number' ? data.summary.fromSignups : 0,
      fromCustom: typeof data.summary.fromCustom === 'number' ? data.summary.fromCustom : 0,
    };
  }, [data?.summary]);

  // Format currency
  // const formatCurrency = (amount: number | undefined | null) => {
  //   const numAmount = typeof amount === 'number' ? amount : 0;
  //   return `${numAmount.toFixed(2)} $`;
  // };
  const formatCurrency = (amount: number | undefined | null) => {
    const numAmount = typeof amount === 'number' ? amount : 0;
    const absAmount = Math.abs(numAmount);

    if (absAmount >= 1000000) {
      return `${(numAmount / 1000000).toFixed(1)}M $`;
    } else if (absAmount >= 1000) {
      return `${(numAmount / 1000).toFixed(1)}K $`;
    }
    return `${numAmount.toFixed(2)} $`;
  };

  if (isLoading) {
    return (
      <AppCard className="mb-4">
        <div className="p-4">
          <div className="animate-pulse h-6 bg-gray-200 rounded w-48" />
        </div>
      </AppCard>
    );
  }

  if (error) {
    return (
      <AppCard className="mb-4">
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'Revenue')}</div>
      </AppCard>
    );
  }

  return (
    <AppCard className="mb-4">
      <div className="flex items-center justify-between p-0">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 rounded-full w-10 h-10 flex items-center justify-center text-white">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('Revenue')}</h2>
            <p className="text-sm text-muted-foreground">{buildSentence(t, 'overview')}</p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-6">
          <div className="text-[14px]">
            {buildSentence(t, 'total', 'revenue')}: <span className="font-semibold text-[18px] ml-2">{formatCurrency(summary.totalRevenue)}</span>
          </div>
          <div className="text-[14px]">
            {buildSentence(t, 'from', 'memberships')}: <span className="font-semibold text-[18px] ml-2">{formatCurrency(summary.fromMemberships)}</span>
          </div>
          <div className="text-[14px]">
            {buildSentence(t, 'from', 'sessions')}: <span className="font-semibold text-[18px] ml-2">{formatCurrency(summary.fromSessions)}</span>
          </div>
        </div>
      </div>
    </AppCard>
  )
}

export default memo(RevenueHeader)