import React, { memo } from 'react'
import { AppCard } from '@/components/layout-ui/app-card'
import { Calendar } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { buildSentence } from '@/locales/translations'
import type { ICheckinAnalytics } from '@shared/interfaces/dashboard.interface'

interface CheckinHeaderProps {
  data: ICheckinAnalytics | null
  isLoading?: boolean
  error?: Error | null
}

function CheckinHeader({ data, isLoading, error }: CheckinHeaderProps) {
  const { t } = useI18n();

  // Calculate totals from timeline data
  const totals = React.useMemo(() => {
    if (!data?.timeline) {
      return {
        total: 0,
        attended: 0,
        missed: 0,
      };
    }

    return data.timeline.reduce(
      (acc, item) => ({
        total: acc.total + (item.attended || 0) + (item.missed || 0),
        attended: acc.attended + (item.attended || 0),
        missed: acc.missed + (item.missed || 0),
      }),
      {
        total: 0,
        attended: 0,
        missed: 0,
      }
    );
  }, [data?.timeline]);

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
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'Checkin')}</div>
      </AppCard>
    );
  }

  return (
    <AppCard className="mb-4">
      <div className="flex items-center justify-between p-0">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 rounded-full w-10 h-10 flex items-center justify-center text-white">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('Checkin')}</h2>
            <p className="text-sm text-muted-foreground">{buildSentence(t, 'overview')}</p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-6">
          <div className="text-[14px]">
            {buildSentence(t, 'total', 'Checkin')}: <span className="font-semibold text-[18px] ml-2">{totals.total}</span>
          </div>
          <div className="text-[14px]">
            {t('attended')}: <span className="font-semibold text-[18px] ml-2">{totals.attended}</span>
          </div>
          <div className="text-[14px]">
            {t('missed')}: <span className="font-semibold text-[18px] ml-2">{totals.missed}</span>
          </div>
        </div>
      </div>
    </AppCard>
  )
}

export default memo(CheckinHeader)
