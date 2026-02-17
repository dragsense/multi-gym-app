import React from "react";
import { DatePicker } from "@/components/shared-ui/date-picker";
import type { DateRange } from "react-day-picker";
import type { IExtraProps } from "./dashboard-view";
import { type TSingleHandlerStore } from "@/stores";
import type { ICombinedDashboardData } from "@/@types/dashboard.type";

interface IDashboardControlsProps {
  store: TSingleHandlerStore<ICombinedDashboardData, IExtraProps>
}

export const DashboardControls: React.FC<IDashboardControlsProps> = ({ store }) => {
  const dateRange = store((state) => state.extra.dateRange);
  const setExtra = store((state) => state.setExtra);

  const handleDateSelect = (date: Date | DateRange | undefined) => {
    let range: DateRange | undefined;
    if (!date) {
      range = undefined;
    } else if (date instanceof Date) {
      range = { from: date };
    } else {
      range = date;
    }

    setExtra('dateRange', range);
    
    const params: Record<string, string> = {};
    if (range?.from) {
      params.from = range.from.toISOString().split('T')[0];
    }
    if (range?.to) {
      params.to = range.to.toISOString().split('T')[0];
    }
    
    store.getState().setParams(params);
  };

  return (
    <div className="flex items-center justify-end">
      <DatePicker
        value={dateRange}
        onSelect={handleDateSelect}
        placeholder="Select date range"
        mode="range"
        showClear={true}
      />
    </div>
  );
};