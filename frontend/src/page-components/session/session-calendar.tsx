import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";

import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react";

// Components
import Calendar from "@/components/shared-ui/calendar";
import {
  type CalendarEvent,
  type CalendarViewType,
} from "@/@types/calendar/calendar.type";
import { AppCard } from "@/components/layout-ui/app-card";
import { Button } from "@/components/ui/button";

// Services
import { fetchCalendarEvents, fetchMemberSessions, fetchTrainerSessions } from "@/services/session.api";

// Types
import { type ISession } from "@shared/interfaces/session.interface";
import {
  ESessionStatus,
  getSessionStatusColor,
} from "@shared/enums/session.enum";

// Hooks
import { useApiQuery } from "@/hooks/use-api-query";
import { useUserSettings } from "@/hooks/use-user-settings";

// Utils
import { formatDate } from "@/lib/utils";
import { EUserLevels } from "@shared/enums/user.enum";

// Stores
import { useRegisteredStore } from "@/stores/store-registry";
import type { TSingleHandlerStore } from "@/stores/single/single-handler-store";
import { Badge } from "@/components/ui/badge";
import { AppSelect } from "@/components/layout-ui/app-select";
import { useAuthUser } from "@/hooks/use-auth-user";

interface ISessionCalendarProps {
  storeKey: string;
  memberId?: string;
  trainerId?: string;
}

const DEFAULT_STATUSES = [];

export default function SessionCalendar({ storeKey, memberId, trainerId }: ISessionCalendarProps) {
  const { user } = useAuthUser();
  const { settings } = useUserSettings();
  const store = useRegisteredStore<TSingleHandlerStore<ISession, any>>(
    storeKey + "-single"
  );

  const setAction = store((state) => state.setAction);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: DateTime.fromJSDate(currentDate).startOf("month").toJSDate(),
    endDate: DateTime.fromJSDate(currentDate).endOf("month").toJSDate(),
  });
  const [statuses, setStatuses] = useState<ESessionStatus[] | undefined>(
    DEFAULT_STATUSES
  );
  const [view, setView] = useState<CalendarViewType>("month");

  // Fetch calendar events
  const queryKey = memberId 
    ? `member-${memberId}-sessions-calendar` 
    : trainerId
    ? `trainer-${trainerId}-sessions-calendar`
    : storeKey + "-calendar";
  
  const fetchFn = memberId 
    ? (params: any) => fetchMemberSessions(memberId, params)
    : trainerId
    ? (params: any) => fetchTrainerSessions(trainerId, params)
    : fetchCalendarEvents;

  const {
    data: sessions = [],
    isLoading,
    setQueryParams,
  } = useApiQuery<ISession[]>(queryKey, fetchFn, {
    ...dateRange,
    ...(memberId || trainerId ? {} : { statuses }),
  });

  useEffect(() => {
    if (memberId || trainerId) {
      setQueryParams(dateRange);
    } else {
      setQueryParams({
        ...dateRange,
        statuses,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.startDate, dateRange.endDate, statuses, memberId, trainerId]);

  // Transform sessions to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    // if session startDateTime is in current then update status InProgress

    return sessions.map((session: ISession) => {
      let statusToShow = session.status;
      if (session.startDateTime && session.endDateTime) {
        const now = new Date();
        const start = new Date(session.startDateTime);
        const end = new Date(session.endDateTime);
        if (
          now >= start &&
          now < end &&
          statusToShow !== ESessionStatus.CANCELLED &&
          statusToShow !== ESessionStatus.COMPLETED
        ) {
          statusToShow = ESessionStatus.IN_PROGRESS;
        }
        if (
          end &&
          now >= end &&
          statusToShow !== ESessionStatus.CANCELLED &&
          statusToShow !== ESessionStatus.COMPLETED
        ) {
          statusToShow = ESessionStatus.PASSED;
        }
      }
      return {
        id: session.id,
        title: session.title,
        startDateTime: session.startDateTime,
        endDateTime: session.endDateTime,
        type: session.type,
        status: statusToShow,
        color: getEventColor(statusToShow),
        session: session, // Keep reference to original session
      };
    });
  }, [sessions]);

  // Get color based on session status
  function getEventColor(status: ESessionStatus): string {
    return `border-l-4 ${getSessionStatusColor(status, "border")}`;
  }

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    if (event.session) {
      setAction("view", event.session.id);
    }
  };

  // Navigation
  const goToPrevious = () => {
    if (view === "day") {
      setCurrentDate((prev) => {
        const dt = DateTime.fromJSDate(prev).minus({ days: 1 });
        setDateRange({
          startDate: dt.startOf("day").toJSDate(),
          endDate: dt.endOf("day").toJSDate(),
        });
        return dt.toJSDate();
      });
    } else if (view === "week") {
      setCurrentDate((prev) => {
        const dt = DateTime.fromJSDate(prev).minus({ weeks: 1 });
        setDateRange({
          startDate: dt.startOf("week").toJSDate(),
          endDate: dt.endOf("week").toJSDate(),
        });
        return dt.toJSDate();
      });
    } else {
      // Month view
      setCurrentDate((prev) => {
        const dt = DateTime.fromJSDate(prev).minus({ months: 1 });
        setDateRange({
          startDate: dt.startOf("month").toJSDate(),
          endDate: dt.endOf("month").toJSDate(),
        });
        return dt.toJSDate();
      });
    }
  };

  const goToNext = () => {
    if (view === "day") {
      setCurrentDate((prev) => {
        const dt = DateTime.fromJSDate(prev).plus({ days: 1 });
        setDateRange({
          startDate: dt.startOf("day").toJSDate(),
          endDate: dt.endOf("day").toJSDate(),
        });
        return dt.toJSDate();
      });
    } else if (view === "week") {
      setCurrentDate((prev) => {
        const dt = DateTime.fromJSDate(prev).plus({ weeks: 1 });
        setDateRange({
          startDate: dt.startOf("week").toJSDate(),
          endDate: dt.endOf("week").toJSDate(),
        });
        return dt.toJSDate();
      });
    } else {
      // Month view
      setCurrentDate((prev) => {
        const dt = DateTime.fromJSDate(prev).plus({ months: 1 });
        setDateRange({
          startDate: dt.startOf("month").toJSDate(),
          endDate: dt.endOf("month").toJSDate(),
        });
        return dt.toJSDate();
      });
    }
  };

  const goToToday = () => {
    const today = DateTime.now();
    setCurrentDate(today.toJSDate());
    setView("day");
    setDateRange({
      startDate: today.startOf("day").toJSDate(),
      endDate: today.endOf("day").toJSDate(),
    });
  };

  // View change handler
  const handleViewChange = (newView: CalendarViewType) => {
    setView(newView);
    // Update date range based on new view and current date (don't change currentDate)
    const dt = DateTime.fromJSDate(currentDate);
    if (newView === "day") {
      setDateRange({
        startDate: dt.startOf("day").toJSDate(),
        endDate: dt.endOf("day").toJSDate(),
      });
    } else if (newView === "week") {
      setDateRange({
        startDate: dt.startOf("week").toJSDate(),
        endDate: dt.endOf("week").toJSDate(),
      });
    } else {
      // Month view
      setDateRange({
        startDate: dt.startOf("month").toJSDate(),
        endDate: dt.endOf("month").toJSDate(),
      });
    }
  };

  const handleStatusChange = (newStatuses: ESessionStatus[]) => {
    const _statuses = newStatuses?.length > 0 ? newStatuses : undefined;

    setStatuses(_statuses);

    if (!memberId) {
      setQueryParams({
        ...dateRange,
        statuses: _statuses,
      });
    }
  };

  const handleAddSession = () => {
    setAction("createOrUpdate");
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <AppCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {view === "day"
                ? formatDate(currentDate, settings)
                : view === "week"
                ? `${formatDate(
                    DateTime.fromJSDate(currentDate).startOf("week").toJSDate(),
                    settings
                  )} - ${formatDate(
                    DateTime.fromJSDate(currentDate).endOf("week").toJSDate(),
                    settings
                  )}`
                : formatDate(currentDate, settings)}
            </h2>

              <AppSelect
                options={[
                  {
                    value: ESessionStatus.SCHEDULED,
                    label: ESessionStatus.SCHEDULED,
                  },
                  {
                    value: ESessionStatus.RESCHEDULED,
                    label: ESessionStatus.RESCHEDULED,
                  },
                  {
                    value: ESessionStatus.COMPLETED,
                    label: ESessionStatus.COMPLETED,
                  },
                  {
                    value: ESessionStatus.CANCELLED,
                    label: ESessionStatus.CANCELLED,
                  },
                ]}
                value={statuses}
                multiple={true}
                onChange={handleStatusChange}
                className="w-[300px]"
                clearable={true}
              />
            
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            {/* View Toggle */}

            <AppSelect
              options={[
                { value: "month", label: "Month" },
                { value: "week", label: "Week" },
                { value: "day", label: "Day" },
              ]}
              value={view}
              onChange={handleViewChange}
              className="w-[100px]"
              clearable={false}
            />

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

              <div className="flex items-center gap-2">
                {user?.level === EUserLevels.ADMIN || user?.level === EUserLevels.STAFF && (
                  <Button size="sm" onClick={handleAddSession}>
                  <Plus className="h-4 w-4" />
                  Add Session
                </Button>
                )}
              </div>
            
          </div>
        </div>
      </AppCard>

      {/* Legend */}
      {calendarEvents.length > 0 && (
        <div className="p-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              Legend:
            </span>
            <div className="flex items-center gap-2">
              <Badge
                className={getSessionStatusColor(
                  ESessionStatus.SCHEDULED,
                  "badge"
                )}
              >
                Scheduled
              </Badge>
              <Badge
                className={getSessionStatusColor(
                  ESessionStatus.RESCHEDULED,
                  "badge"
                )}
              >
                Rescheduled
              </Badge>
              <Badge
                className={getSessionStatusColor(
                  ESessionStatus.IN_PROGRESS,
                  "badge"
                )}
              >
                In Progress
              </Badge>
              <Badge
                className={getSessionStatusColor(
                  ESessionStatus.COMPLETED,
                  "badge"
                )}
              >
                Completed
              </Badge>
              <Badge
                className={getSessionStatusColor(
                  ESessionStatus.CANCELLED,
                  "badge"
                )}
              >
                Cancelled
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="text-center">
            <CalendarIcon className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        </div>
      ) : (
        <Calendar
          events={calendarEvents}
          onEventClick={handleEventClick}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          view={view}
          setView={setView}
        />
      )}
    </div>
  );
}

