import React from "react"
import { DatePicker } from "@/components/shared-ui/date-picker"
import type { DateRange } from "react-day-picker"
import type { IPlatformOwnerDashboardStats } from "@shared/interfaces/platform-owner-dashboard.interface";
import { useI18n } from "@/hooks/use-i18n";

import type { IPlatformOwnerDashboardExtraProps } from "./platform-owner-dashboard-view"
import { type TSingleHandlerStore } from "@/stores"

interface IPlatformOwnerDashboardControlsProps {
  store: TSingleHandlerStore<IPlatformOwnerDashboardStats, IPlatformOwnerDashboardExtraProps>
}

export const PlatformOwnerDashboardControls: React.FC<IPlatformOwnerDashboardControlsProps> = ({
  store
}) => {
  const { t } = useI18n();
  let customRange = store((state) => state.extra.customRange)
  const setExtra = store((state) => state.setExtra)

  const handleDateSelect = (date: Date | DateRange | undefined) => {
    if (!date) {
      // Clear the range - backend will use default last month
      setExtra('customRange', undefined);
      store.getState().setParams({ customRange: undefined });
      return;
    }

    let range: DateRange | undefined;
    if (date instanceof Date) {
      range = { from: date };
    } else if ("from" in date) {
      const { from, to } = date;
      if (from && to && from.getTime() !== to.getTime()) {
        range = { from, to };
      } else if (from) {
        range = { from };
      }
    }

    if (range) {
      setExtra('customRange', range);
      // Trigger refetch by updating params
      store.getState().setParams({ customRange: range });
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-end">
      <DatePicker
        value={customRange}
        onSelect={handleDateSelect}
        placeholder={t('customRange')}
        mode="range"
      />
    </div>
  )
}
