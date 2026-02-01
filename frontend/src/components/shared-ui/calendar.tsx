import { useMemo, useId } from "react";
import { DateTime, Interval } from "luxon";
import { Clock, MoreHorizontal } from "lucide-react";
import { formatDate, formatTimeString } from "@shared/lib/format.utils";
import { useUserSettings } from "@/hooks/use-user-settings";

// UI Components
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { AppCard } from "@/components/layout-ui/app-card";

// Types
import type {
  CalendarEvent,
  CalendarProps,
} from "@/@types/calendar/calendar.type";

export default function Calendar({
  events = [],
  onEventClick,
  className = "",
  currentDate,
  setCurrentDate,
  view,
  setView,
}: CalendarProps) {
  const componentId = useId();
  const { settings } = useUserSettings();

  const maxDailyEventsToShow = 10;
  const maxWeeklyEventsToShow = 2;
  const maxMonthlyEventsToShow = 3;

  // Memoized calendar data
  const calendarData = useMemo(() => {
    const dt = DateTime.fromJSDate(currentDate);
    if (view === "day") {
      return [currentDate];
    } else if (view === "week") {
      // Week starts on Sunday (weekday 7 in Luxon = Sunday)
      // Luxon weekday: 1=Monday, 2=Tuesday, ..., 7=Sunday
      const currentWeekday = dt.weekday; // 1-7
      const daysToSubtract = currentWeekday === 7 ? 0 : currentWeekday;
      const weekStart = dt.minus({ days: daysToSubtract }).startOf("day");
      const weekEnd = weekStart.plus({ days: 6 }).endOf("day");
      return Interval.fromDateTimes(weekStart, weekEnd)
        .splitBy({ days: 1 })
        .map((d) => d.start?.toJSDate() || new Date());
    } else {
      // Month view - need to show full calendar grid including previous/next month days
      const monthStart = dt.startOf("month").startOf("day");
      const monthEnd = dt.endOf("month").startOf("day");
      
      // Calculate week start (Sunday) for the first day of month
      // Luxon weekday: 1=Monday, 2=Tuesday, ..., 7=Sunday
      const firstDayWeekday = monthStart.weekday;
      const daysToSubtract = firstDayWeekday === 7 ? 0 : firstDayWeekday;
      const start = monthStart.minus({ days: daysToSubtract });
      
      // Calculate week end (Saturday) for the last day of month
      const lastDayWeekday = monthEnd.weekday;
      const daysToAdd = lastDayWeekday === 7 ? 6 : (6 - lastDayWeekday);
      const end = monthEnd.plus({ days: daysToAdd });
      
      return Interval.fromDateTimes(start, end)
        .splitBy({ days: 1 })
        .map((d) => {
          const date = d.start?.toJSDate();
          if (!date) return new Date();
          // Normalize to start of day to avoid timezone issues
          const normalized = new Date(date);
          normalized.setHours(0, 0, 0, 0);
          return normalized;
        });
    }
  }, [currentDate, view]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    // Normalize date to start of day for accurate comparison
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const dt = DateTime.fromJSDate(normalizedDate).startOf("day");
    
    return events.filter((event) => {
      const eventDate =
        typeof event.startDateTime === "string"
          ? DateTime.fromISO(event.startDateTime)
          : DateTime.fromJSDate(event.startDateTime);
      // Compare at day level, normalizing both to start of day
      return eventDate.startOf("day").hasSame(dt, "day");
    });
  };

  // Get events for a specific date and time slot
  const getEventsForTimeSlot = (date: Date, hour: number) => {
    const dateEvents = getEventsForDate(date);

    const filteredEvents = dateEvents.filter((event) => {
      const eventDate =
        typeof event.startDateTime === "string"
          ? new Date(event.startDateTime)
          : event.startDateTime;
      const eventStartHour = eventDate.getHours();

      const startsInThisHour = eventStartHour === hour;

      return startsInThisHour;
    });

    return filteredEvents;
  };

  // Event click handler
  const handleEventClick = (event: CalendarEvent) => {
    onEventClick?.(event);
  };

  // Date click handler
  const handleDateClick = (date: Date) => {
    setView("day");
    setCurrentDate(date);
  };

  // Render event badge
  const renderEventBadge = (
    event: CalendarEvent,
    dir: "vertical" | "horizontal" = "vertical"
  ) => {
    const { formattedStart, formattedEnd } = formatEventTimeRange(event);
    // Use status-based colors if status exists, otherwise fall back to event.color or default
    const eventColorClasses = event.color || "border-l-4 border-gray-400";

    return (
      <Tooltip key={event.id}>
        <TooltipTrigger asChild>
          <div
            className={`cursor-pointer text-xs ${eventColorClasses} rounded-md px-2 py-2 mb-1 transition-all hover:opacity-80 w-full shadow-md`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleEventClick(event);
            }}
          >
            <div className="overflow-hidden h-full">
              <div className="flex items-start gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                <p
                  className={
                    dir === "horizontal" ? "flex flex-col" : "w-full truncate"
                  }
                  style={
                    dir === "horizontal"
                      ? { overflow: "visible", whiteSpace: "normal" }
                      : {}
                  }
                >
                  <span>{formattedStart}</span> <span>{event.title}</span>
                </p>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="flex flex-col gap-1 max-w-xs p-3 shadow-md rounded-md"
        >
          <span className="font-medium">
            {formattedStart} - {formattedEnd}
          </span>
          <span>{event.title}</span>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Helper function to format event time range
  const formatEventTimeRange = (event: CalendarEvent) => {
    const eventStartDateTime =
      typeof event.startDateTime === "string"
        ? new Date(event.startDateTime)
        : event.startDateTime;

    const startTimeStr = `${String(eventStartDateTime.getHours()).padStart(
      2,
      "0"
    )}:${String(eventStartDateTime.getMinutes()).padStart(2, "0")}`;

    const eventEndDateTime =
      typeof event.endDateTime === "string"
        ? new Date(event.endDateTime)
        : event.endDateTime;

    const endTimeStr = `${String(eventEndDateTime.getHours()).padStart(
      2,
      "0"
    )}:${String(eventEndDateTime.getMinutes()).padStart(2, "0")}`;

    const formattedStart = formatTimeString(startTimeStr, settings);
    const formattedEnd = formatTimeString(endTimeStr, settings);
    return { formattedStart, formattedEnd };
  };

  // Unified function to render more events popup for all views
  const renderMoreEvents = (
    events: CalendarEvent[],
    remainingCountText: string,
    showIcon: boolean = true
  ) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge
            variant="outline"
            className="text-xs cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {showIcon && <MoreHorizontal className="w-3 h-3 mr-1" />}
            {remainingCountText}
          </Badge>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 max-h-64 overflow-y-auto p-3"
          side="top"
          align="start"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <div className="space-y-2">
            {events.map((event) => renderEventBadge(event))}
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Generate time slots (24 hours: 00:00 to 23:00)
  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const timeString = `${i.toString().padStart(2, "0")}:00`;
      const formattedTime = formatTimeString(timeString, settings);
      return {
        time: formattedTime,
        hour: i,
      };
    });
  }, [settings]);

  // Render time-based daily view
  const renderDailyTimeView = () => {
    const isTodayDate = DateTime.fromJSDate(currentDate).hasSame(
      DateTime.now(),
      "day"
    );

    return (
      <div className="flex">
        {/* Time column */}
        <div className="w-20 border-r">
          <div className="h-12 border-b border-muted"></div>{" "}
          {/* Header spacer */}
          {timeSlots.map((slot) => (
            <div
              key={slot.time}
              className="h-16 border-b border-muted text-xs text-muted-foreground p-2"
            >
              {slot.time}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className={`flex-1 ${isTodayDate ? "bg-background" : ""}`}>
          {/* Day header - Sticky */}
          <div className="h-12 p-4 text-center font-semibold sticky top-0 z-30 bg-muted">
            <div className="flex items-center justify-center gap-2">
              <div className={`text-lg ${isTodayDate ? "text-primary" : ""}`}>
                {formatDate(currentDate, settings)}
              </div>
              {isTodayDate && (
                <>
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <Badge className="bg-primary/10 text-primary">Today</Badge>
                </>
              )}
            </div>
          </div>

          {/* Time slots */}
          {timeSlots.map((slot) => {
            const slotEvents = getEventsForTimeSlot(currentDate, slot.hour);
            const eventsToShow = slotEvents.slice(0, maxDailyEventsToShow);
            const remainingEventsToShow =
              slotEvents.slice(maxDailyEventsToShow);
            return (
              <div
                key={slot.time}
                className="h-16 border-t border-muted relative flex gap-1 p-1"
              >
                {eventsToShow.map((event) =>
                  renderEventBadge(event, "horizontal")
                )}
                {slotEvents.length > maxDailyEventsToShow &&
                  renderMoreEvents(
                    remainingEventsToShow,
                    `+${slotEvents.length - maxDailyEventsToShow} more`
                  )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render time-based weekly view
  const renderWeeklyTimeView = () => {
    const weekDays = calendarData;

    return (
      <div className="flex">
        {/* Time column */}
        <div className="w-20 border-r">
          <div className="h-12 border-b border-muted"></div>{" "}
          {/* Header spacer */}
          {timeSlots.map((slot) => (
            <div
              key={slot.time}
              className="h-16 border-b border-muted text-xs text-muted-foreground/50 p-2"
            >
              {slot.time}
            </div>
          ))}
        </div>

        {/* Days columns */}
        <div className="flex-1 grid grid-cols-7">
          {weekDays.map((date, dayIndex) => {
            const isTodayDate = DateTime.fromJSDate(date).hasSame(
              DateTime.now(),
              "day"
            );
            return (
              <div
                key={dayIndex}
                className={`border-r border-muted last:border-r-0 ${
                  isTodayDate ? "bg-background" : ""
                }`}
              >
                {/* Day header - Sticky */}
                <div className="h-12 p-2 text-center font-semibold sticky top-0 z-30 bg-muted">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <span className="text-sm">
                      {DateTime.fromJSDate(date).toFormat("EEE")}
                    </span>
                    &nbsp;
                    <span className={`${isTodayDate ? "text-primary" : ""}`}>
                      {DateTime.fromJSDate(date).toFormat("d")}
                    </span>
                    {isTodayDate && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </div>

                {/* Time slots for this day */}
                {timeSlots.map((slot) => {
                  const slotEvents = getEventsForTimeSlot(date, slot.hour);
                  const eventsToShow = slotEvents.slice(
                    0,
                    maxWeeklyEventsToShow
                  );
                  const remainingEventsToShow = slotEvents.slice(
                    maxWeeklyEventsToShow
                  );
                  return (
                    <div
                      key={slot.time}
                      className="h-16 border-t border-muted relative flex gap-1 overflow-hidden p-1"
                    >
                      {eventsToShow.map((event) =>
                        renderEventBadge(event, "horizontal")
                      )}

                      {slotEvents.length > maxWeeklyEventsToShow &&
                        renderMoreEvents(
                          remainingEventsToShow,
                          `+${slotEvents.length - maxWeeklyEventsToShow}`,
                          false
                        )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    return (
      <>
        {/* Day Headers - Sticky */}
        <div className="grid grid-cols-7 border-b sticky top-0 z-30 bg-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-4 text-center font-semibold text-muted-foreground border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarData.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const eventsToShow = dayEvents.slice(0, maxMonthlyEventsToShow);
            const remainingEventsToShow = dayEvents.slice(
              maxMonthlyEventsToShow
            );
            const isCurrentMonth = DateTime.fromJSDate(date).hasSame(
              DateTime.fromJSDate(currentDate),
              "month"
            );
            const isTodayDate = DateTime.fromJSDate(date).hasSame(
              DateTime.now(),
              "day"
            );
            // Friday (5), Saturday (6), and Sunday (0) are considered weekends
            const isWeekend = date.getDay() === 0 || date.getDay() === 5 || date.getDay() === 6;

            return (
              <div
                key={index}
                className={`min-h-[120px] border-r border-b last:border-r-0 p-2 cursor-pointer border-muted ${
                  !isCurrentMonth
                    ? "bg-background text-muted-foreground opacity-30"
                    : ""
                } ${isWeekend ? "bg-background opacity-80" : ""} ${
                  isTodayDate ? "bg-background" : ""
                }`}
                onDoubleClick={() => {
                  handleDateClick(date);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isTodayDate ? "text-primary" : ""
                    }`}
                  >
                    {DateTime.fromJSDate(date).toFormat("d")}
                  </span>
                  {isTodayDate && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {eventsToShow.map((event) => renderEventBadge(event))}
                  {dayEvents.length > maxMonthlyEventsToShow &&
                    renderMoreEvents(
                      remainingEventsToShow,
                      `+${dayEvents.length - maxMonthlyEventsToShow} more`
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className={`space-y-4 ${className}`} data-component-id={componentId}>
      {/* Calendar Grid */}
      <AppCard className="p-0">
        <CardContent className="p-0">
          {view === "day"
            ? /* Day Time View */
              renderDailyTimeView()
            : view === "week"
            ? /* Week Time View */
              renderWeeklyTimeView()
            : /* Month View */
              renderMonthView()}
        </CardContent>
      </AppCard>
    </div>
  );
}
