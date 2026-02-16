import React, { memo } from 'react'
import { AppCard } from '@/components/layout-ui/app-card'
import { Calendar } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { buildSentence } from '@/locales/translations'

interface SessionsHeaderProps {
  data: {
    timeline?: Array<{
      period: string;
      totalSessions: number;
      completedSessions: number;
      scheduledSessions: number;
      cancelledSessions: number;
    }>;
    totals?: {
      total: number;
      scheduled: number;
      inProgress: number;
      completed: number;
      cancelled: number;
      rescheduled: number;
    };
    period?: string;
  } | null
  isLoading?: boolean
  error?: Error | null
}

function SessionsHeader({ data, isLoading, error }: SessionsHeaderProps) {
  const { t } = useI18n();

  // Use totals directly if provided, otherwise calculate from timeline
  const totals = React.useMemo(() => {
    // If totals are provided directly (from stats.overview), use them
    if (data?.totals) {
      return {
        total: data.totals.total || 0,
        scheduled: data.totals.scheduled || 0,
        inProgress: data.totals.inProgress || 0,
        completed: data.totals.completed || 0,
        cancelled: data.totals.cancelled || 0,
        rescheduled: data.totals.rescheduled || 0,
        awaitingConfirmation: 0,
      };
    }

    // Fallback: Calculate from timeline data
    if (!data?.timeline || data.timeline.length === 0) {
      return {
        total: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        rescheduled: 0,
        awaitingConfirmation: 0,
      };
    }

    return data.timeline.reduce(
      (acc, item) => ({
        total: acc.total + item.totalSessions,
        scheduled: acc.scheduled + item.scheduledSessions,
        inProgress: 0,
        completed: acc.completed + item.completedSessions,
        cancelled: acc.cancelled + item.cancelledSessions,
        rescheduled: 0,
        awaitingConfirmation: 0,
      }),
      {
        total: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        rescheduled: 0,
        awaitingConfirmation: 0,
      }
    );
  }, [data?.totals, data?.timeline]);

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
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'sessions')}</div>
      </AppCard>
    );
  }

  return (
    <AppCard className="mb-4">
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 rounded-full w-10 h-10 flex items-center justify-center text-white">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('sessions')}</h2>
            <p className="text-sm text-muted-foreground">{buildSentence(t, 'overview')}</p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-6">
          <div className="text-[14px]">
            {buildSentence(t, 'total', 'sessions')}: <span className="font-semibold text-[18px] ml-2">{totals.total}</span>
          </div>
          <div className="text-[14px]">
            {t('scheduled')}: <span className="font-semibold text-[18px] ml-2">{totals.scheduled}</span>
          </div>
          <div className="text-[14px]">
            {buildSentence(t, 'in', 'progress')}: <span className="font-semibold text-[18px] ml-2">{totals.inProgress}</span>
          </div>
          <div className="text-[14px]">
            {t('completed')}: <span className="font-semibold text-[18px] ml-2">{totals.completed}</span>
          </div>
          <div className="relative group">
            <div className="text-[14px] cursor-pointer">
              <span className="font-semibold text-[18px]">3+</span> {buildSentence(t, 'more')}
            </div>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('cancelled')}:</span>
                  <span className="font-semibold">{totals.cancelled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('reschedule')}d:</span>
                  <span className="font-semibold">{totals.rescheduled}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{buildSentence(t, 'awaiting', 'confirmation')}:</span>
                  <span className="font-semibold">{totals.awaitingConfirmation}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  )
}

export default memo(SessionsHeader)
