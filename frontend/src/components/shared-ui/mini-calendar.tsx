"use member";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime, Interval } from "luxon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/hooks/use-i18n";

export interface UnavailableDateRange {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface MiniCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  offDays?: string[]; // Array of day names like ["sunday", "saturday"]
  unavailableRanges?: UnavailableDateRange[]; // Array of date ranges
  className?: string;
  month?: Date;
  onMonthChange?: (date: Date) => void;
}

const dayNames = [
  "sunday",    // 0 - JavaScript getDay() returns 0 for Sunday
  "monday",    // 1
  "tuesday",   // 2
  "wednesday", // 3
  "thursday",  // 4
  "friday",    // 5
  "saturday",   // 6
] as const;

export function MiniCalendar({
  selected,
  onSelect,
  disabled,
  offDays = [],
  unavailableRanges = [],
  className,
  month: controlledMonth,
  onMonthChange,
}: MiniCalendarProps) {
  const { t } = useI18n();
  const [internalMonth, setInternalMonth] = React.useState(new Date());
  const month = controlledMonth ?? internalMonth;

  // Get translated day abbreviations
  const dayAbbreviations = React.useMemo(() => {
    const getDayAbbr = (key: string, fallback: string) => {
      const translated = t(key);
      // If translation returns the key itself, use fallback
      if (translated === key || !translated) {
        return fallback;
      }
      return translated.substring(0, 3);
    };
    return [
      getDayAbbr("sunday", "Sun"),
      getDayAbbr("monday", "Mon"),
      getDayAbbr("tuesday", "Tue"),
      getDayAbbr("wednesday", "Wed"),
      getDayAbbr("thursday", "Thu"),
      getDayAbbr("friday", "Fri"),
      getDayAbbr("saturday", "Sat"),
    ];
  }, [t]);

  const setMonth = React.useCallback(
    (newMonth: Date) => {
      if (controlledMonth === undefined) {
        setInternalMonth(newMonth);
      }
      onMonthChange?.(newMonth);
    },
    [controlledMonth, onMonthChange]
  );

  // Get calendar days for the month
  // Calculate week start (Sunday) to match JavaScript's getDay() which uses Sunday=0
  // Luxon weekday: 1=Monday, 2=Tuesday, ..., 7=Sunday
  const dt = DateTime.fromJSDate(month);
  const monthStart = dt.startOf("month").startOf("day");
  const monthEnd = dt.endOf("month").startOf("day");
  
  // Calculate week start (Sunday) for the first day of month
  const firstDayWeekday = monthStart.weekday; // Luxon: 1-7 (Mon-Sun)
  const daysToSubtract = firstDayWeekday === 7 ? 0 : firstDayWeekday;
  const calendarStart = monthStart.minus({ days: daysToSubtract });
  
  // Calculate week end (Saturday) for the last day of month
  const lastDayWeekday = monthEnd.weekday;
  const daysToAdd = lastDayWeekday === 7 ? 6 : (6 - lastDayWeekday);
  const calendarEnd = monthEnd.plus({ days: daysToAdd });
  
  const days = Interval.fromDateTimes(calendarStart, calendarEnd)
    .splitBy({ days: 1 })
    .map((d) => {
      const date = d.start?.toJSDate();
      if (!date) return new Date();
      // Normalize to start of day to avoid timezone issues
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    });

  // Navigation
  const goToPreviousMonth = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMonth(DateTime.fromJSDate(month).minus({ months: 1 }).toJSDate());
  };

  const goToNextMonth = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMonth(DateTime.fromJSDate(month).plus({ months: 1 }).toJSDate());
  };

  // Check if a date is disabled
  const isDateDisabled = React.useCallback(
    (date: Date) => {
      // Check custom disabled function
      if (disabled?.(date)) return true;

      // Check if it's an off day
      // Use JavaScript's getDay() which returns 0-6 (Sunday-Saturday)
      const dayIndex = date.getDay();
      const dayName = dayNames[dayIndex];
      // Normalize comparison to handle case-insensitive matching and trim whitespace
      if (offDays.some(offDay => offDay.trim().toLowerCase() === dayName.toLowerCase())) return true;

      // Check if it's in unavailable ranges
      const dateString = DateTime.fromJSDate(date).toFormat("yyyy-MM-dd");
      const isInUnavailableRange = unavailableRanges.some((range) => {
        return dateString >= range.startDate && dateString <= range.endDate;
      });
      if (isInUnavailableRange) return true;

      // Disable past dates
      const today = DateTime.now().startOf("day");
      const checkDate = DateTime.fromJSDate(date).startOf("day");
      if (checkDate < today) return true;

      return false;
    },
    [disabled, offDays, unavailableRanges]
  );

  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onSelect?.(date);
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold">
          {DateTime.fromJSDate(month).toFormat("MMMM yyyy")}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayAbbreviations.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const dtDate = DateTime.fromJSDate(date);
          const dtMonth = DateTime.fromJSDate(month);
          const isCurrentMonth = dtDate.hasSame(dtMonth, "month");
          const isTodayDate = dtDate.hasSame(DateTime.now(), "day");
          const isSelectedDate =
            selected && dtDate.hasSame(DateTime.fromJSDate(selected), "day");
          const isDisabled = isDateDisabled(date);

          // Check if it's an off day
          // Use JavaScript's getDay() which returns 0-6 (Sunday-Saturday)
          const dayIndex = date.getDay();
          const dayName = dayNames[dayIndex];
          // Normalize comparison to handle case-insensitive matching and trim whitespace
          const isOffDay = offDays.some(offDay => offDay.trim().toLowerCase() === dayName.toLowerCase());

          // Check if it's in an unavailable range
          const dateString = dtDate.toFormat("yyyy-MM-dd");
          const isInUnavailableRange = unavailableRanges.some((range) => {
            return dateString >= range.startDate && dateString <= range.endDate;
          });

          return (
            <Button
              key={index}
              type="button"
              variant={isSelectedDate ? "default" : "ghost"}
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={cn(
                "aspect-square h-auto w-full rounded-md text-xs font-medium p-0",
                !isCurrentMonth && "text-muted-foreground opacity-40",
                isTodayDate &&
                  !isSelectedDate &&
                  "bg-accent text-accent-foreground",
                isSelectedDate &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                isDisabled &&
                  "opacity-50 cursor-not-allowed hover:bg-transparent",
                (isOffDay || isInUnavailableRange) &&
                  !isSelectedDate &&
                  !isTodayDate &&
                  "bg-muted/50"
              )}
              aria-label={dtDate.toFormat("EEEE, MMMM d, yyyy")}
              aria-selected={isSelectedDate}
            >
              {dtDate.toFormat("d")}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
