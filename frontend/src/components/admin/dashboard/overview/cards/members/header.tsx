import React, { memo } from 'react'
import { AppCard } from '@/components/layout-ui/app-card'
import { Users } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { buildSentence } from '@/locales/translations'

interface MembersHeaderProps {
  data: any
  isLoading?: boolean
  error?: Error | null
}

function MembersHeader({ data, isLoading, error }: MembersHeaderProps) {
  const { t } = useI18n();

  const totals = data?.totals || { total: 0, active: 0, inactive: 0 }

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
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'members')}</div>
      </AppCard>
    );
  }

  return (
    <AppCard className="mb-4">
      <div className="flex items-center justify-between p-0">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 rounded-full w-10 h-10 flex items-center justify-center text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('members')}</h2>
            <p className="text-sm text-muted-foreground">{buildSentence(t, 'overview')}</p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground flex items-center gap-6">
          <div className="text-[14px]">{buildSentence(t, 'total', 'members')}: <span className="font-semibold text-[18px] ml-2">{totals.total}</span></div>
          <div className="text-[14px]">{buildSentence(t, 'active')}: <span className="font-semibold text-[18px] ml-2">{totals.active}</span></div>
        </div>
      </div>
    </AppCard>
  )
}

export default memo(MembersHeader)
