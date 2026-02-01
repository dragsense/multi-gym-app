import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/shared-ui/date-picker";
import type { DateRange } from "react-day-picker";
import { EAnalyticsPeriod } from "@shared/enums";
import type { ICombinedDashboardData } from "@shared/interfaces/dashboard.interface";
import type { IExtraProps } from "./dashboard-view";
import { type TSingleHandlerStore } from "@/stores";

interface IDashboardControlsProps {
  store: TSingleHandlerStore<ICombinedDashboardData, IExtraProps>
}

export const DashboardControls: React.FC<IDashboardControlsProps> = ({ store }) => {
  const period = store((state) => state.extra.period);
  const customRange = store((state) => state.extra.customRange);
  const setExtra = store((state) => state.setExtra);

  // Synchronize filter state to URL
  const syncToURL = (newPeriod: string, range?: DateRange) => {
    const params = new URLSearchParams(window.location.search);
    params.set('period', newPeriod);
    
    if (range?.from) {
      params.set('from', range.from.toISOString().split('T')[0]);
    } else {
      params.delete('from');
    }
    
    if (range?.to) {
      params.set('to', range.to.toISOString().split('T')[0]);
    } else {
      params.delete('to');
    }

    const newURL = window.location.pathname + '?' + params.toString();
    window.history.pushState(null, '', newURL);
  };

  const handleDateSelect = (date: Date | DateRange | undefined) => {
    let range: DateRange | undefined;
    if (!date) {
      range = undefined;
    } else if (date instanceof Date) {
      range = { from: date };
    } else {
      range = date;
    }

    setExtra('customRange', range);
    store.getState().setParams({ customRange: range });
    syncToURL(period, range);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-end">
      <div className="flex gap-2">
        <DatePicker
          value={customRange}
          onSelect={handleDateSelect}
          placeholder="Custom range"
          mode="range"
        />

        <Select
          value={period}
          onValueChange={(value: EAnalyticsPeriod) => {
            setExtra('period', value);
            store.getState().setParams({ period: value });
            syncToURL(value, customRange);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EAnalyticsPeriod.DAY}>Daily</SelectItem>
            <SelectItem value={EAnalyticsPeriod.WEEK}>Weekly</SelectItem>
            <SelectItem value={EAnalyticsPeriod.MONTH}>Monthly</SelectItem>
            <SelectItem value={EAnalyticsPeriod.YEAR}>Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

//-------below code to be used for dummy data in graphs only-----------------------


// import React from "react"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { DatePicker } from "@/components/shared-ui/date-picker"
// import type { DateRange } from "react-day-picker"
// import { EAnalyticsPeriod } from "@shared/enums";

// interface IDashboardControlsProps {
//   period: EAnalyticsPeriod;
//   setPeriod: (period: EAnalyticsPeriod) => void;
//   customRange: DateRange | undefined;
//   setCustomRange: (range: DateRange | undefined) => void;
// }

// export const DashboardControls: React.FC<IDashboardControlsProps> = ({
//   period,
//   setPeriod,
//   customRange,
//   setCustomRange
// }) => {

//   const handleDateSelect = (date: Date | DateRange | undefined) => {
//     if (!date) {
//       setCustomRange(undefined);
//       return;
//     }

//     let range: DateRange | undefined;
//     if (date instanceof Date) {
//       range = { from: date };
//     } else if ("from" in date) {
//       const { from, to } = date;
//       if (from && to && from.getTime() !== to.getTime()) {
//         range = { from, to };
//       } else if (from) {
//         range = { from };
//       }
//     }
//     setCustomRange(range);
//   }

//   return (
//     <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-end">
//       <div className="flex gap-2">
//         <DatePicker
//           value={customRange}
//           onSelect={handleDateSelect}
//           placeholder="Custom range"
//           mode="range"
//         />

//         <Select
//           value={period}
//           onValueChange={(value: EAnalyticsPeriod) => setPeriod(value)}
//         >
//           <SelectTrigger className="w-32">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value={EAnalyticsPeriod.DAY}>Daily</SelectItem>
//             <SelectItem value={EAnalyticsPeriod.WEEK}>Weekly</SelectItem>
//             <SelectItem value={EAnalyticsPeriod.MONTH}>Monthly</SelectItem>
//             <SelectItem value={EAnalyticsPeriod.YEAR}>Yearly</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//     </div>
//   )
// }

//---------------above code only to be used when displaying graphs with dummy data------------
