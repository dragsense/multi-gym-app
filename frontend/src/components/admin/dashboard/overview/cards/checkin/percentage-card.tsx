import React, { memo } from 'react'
import { AppCard } from '@/components/layout-ui/app-card'
import { useI18n } from '@/hooks/use-i18n'
import { buildSentence } from '@/locales/translations'
import type { ICheckinAnalytics } from '@shared/interfaces/dashboard.interface'

interface PercentageCardProps {
  data: ICheckinAnalytics | null
  isLoading?: boolean
  error?: Error | null
}

function PercentageCard({ data, isLoading, error }: PercentageCardProps) {
  const { t } = useI18n();

  const percentage = typeof data?.percentage?.percentage === 'number' ? data.percentage.percentage : 0;

  // 1. Define standard angles for a semi-circle curving UP in SVG
  // Left side = 180°, Top = 270°, Right side = 360°
  const startAngle = 180;
  const endAngle = 360;
  // Progress fills from 180° towards 360°
  const filledAngle = startAngle + (percentage / 100) * 180;

  const radius = 100;
  const strokeWidth = 24;
  const centerX = 100;
  const centerY = 100;

  // 2. Updated createArcPath with standard math
  const createArcPath = (startDeg: number, endDeg: number) => {
    // Standard conversion: radians = degrees * PI / 180
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const largeArcFlag = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;

    // Sweep flag '1' draws clockwise. 
    // In SVG (y-axis down), moving from 180° to 360° via 270° curves UP.
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

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
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'checkin', 'percentage')}</div>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium">{t('Checkin Percentage')}</h3>
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          {/* Gauge SVG */}
          <div className="relative mb-8" style={{ width: '300px', height: '160px' }}>
            <svg width="300" height="160" viewBox="0 0 200 160" className="overflow-visible">
              {/* Background arc (missed checkins gray) - full semi-circle */}
              <path
                d={createArcPath(startAngle, endAngle)}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              {/* Filled arc (attended checkins red) */}
              {percentage > 0 && (
                <path
                  d={createArcPath(startAngle, filledAngle)}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              )}
            </svg>

            {/* Percentage text */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center w-full">
              <div className="text-4xl font-semibold mb-1">
                {percentage.toFixed(2)}%
              </div>
              <div className="text-base font-medium">{t('Attended')}</div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 justify-center mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-sm text-gray-700">{t('Attended')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded"></div>
              <span className="text-sm text-gray-700">{t('Missed')}</span>
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  )
}

export default memo(PercentageCard)
