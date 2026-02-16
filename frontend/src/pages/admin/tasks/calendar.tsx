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
import { fetchTaskCalendarEvents } from "@/services/task.api";

// Types
import { type ITask } from "@shared/interfaces/task.interface";
import { ETaskStatus, ETaskPriority } from "@shared/enums/task.enum";

// Hooks
import { useApiQuery } from "@/hooks/use-api-query";
import { useUserSettings } from "@/hooks/use-user-settings";

// Utils
import { formatDate } from "@/lib/utils";

// Stores
import { useRegisteredStore } from "@/stores/store-registry";
import type { TSingleHandlerStore } from "@/stores/single/single-handler-store";
import { Badge } from "@/components/ui/badge";
import { AppSelect } from "@/components/layout-ui/app-select";

interface ITasksCalendarProps {
  storeKey: string;
}

const DEFAULT_STATUSES: ETaskStatus[] = [];

// Get color based on task priority
function getEventColor(priority: ETaskPriority): string {
  const colors = {
    [ETaskPriority.LOW]: "border-l-4 border-blue-500",
    [ETaskPriority.MEDIUM]: "border-l-4 border-yellow-500",
    [ETaskPriority.HIGH]: "border-l-4 border-orange-500",
    [ETaskPriority.URGENT]: "border-l-4 border-red-500",
  };
  return colors[priority] || "border-l-4 border-gray-500";
}

// Get status color
function getStatusColor(status: ETaskStatus): string {
  const colors = {
    [ETaskStatus.TODO]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    [ETaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    [ETaskStatus.IN_REVIEW]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    [ETaskStatus.DONE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    [ETaskStatus.CANCELLED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };
  return colors[status] || "";
}

export default function TasksCalendar({ storeKey }: ITasksCalendarProps) {
  const { settings } = useUserSettings();
  const store = useRegisteredStore<TSingleHandlerStore<ITask, any>>(
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
  const [statuses, setStatuses] = useState<ETaskStatus[] | undefined>(
    DEFAULT_STATUSES
  );
  const [view, setView] = useState<CalendarViewType>("month");

  // Fetch calendar events
  const {
    data: tasks = [],
    isLoading,
    setQueryParams,
  } = useApiQuery<ITask[]>([storeKey + "-calendar"], fetchTaskCalendarEvents, {
    ...dateRange,
    statuses,
  });

  useEffect(() => {
    setQueryParams(dateRange);
  }, [dateRange]);

  // Transform tasks to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    return tasks.map((task: ITask) => {
      // Use startDateTime as the event time
      const startDateTime = task.startDateTime ? new Date(task.startDateTime) : new Date();
      const endDateTime = task.dueDate ? new Date(task.dueDate) : startDateTime;

      return {
        id: task.id,
        title: task.title,
        startDateTime,
        endDateTime,
        status: task.status,
        priority: task.priority,
        color: getEventColor(task.priority),
        task: task, // Keep reference to original task
        isCalendarEvent: task.isCalendarEvent || task.id?.includes('@'),
        originalTaskId: task.originalTaskId,
        eventDate: task.eventDate,
      };
    });
  }, [tasks]);

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    if (event.task) {
      setAction("view", event.task.id);
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

  const handleStatusChange = (newStatuses: ETaskStatus[]) => {
    const _statuses = newStatuses?.length > 0 ? newStatuses : undefined;

    setStatuses(_statuses);

    setQueryParams({
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
      statuses: _statuses,
    });
  };

  const handleAddTask = () => {
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
                  value: ETaskStatus.TODO,
                  label: "To Do",
                },
                {
                  value: ETaskStatus.IN_PROGRESS,
                  label: "In Progress",
                },
                {
                  value: ETaskStatus.IN_REVIEW,
                  label: "In Review",
                },
                {
                  value: ETaskStatus.DONE,
                  label: "Done",
                },
                {
                  value: ETaskStatus.CANCELLED,
                  label: "Cancelled",
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
              <Button size="sm" onClick={handleAddTask}>
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
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
              <Badge className={getStatusColor(ETaskStatus.TODO)}>
                To Do
              </Badge>
              <Badge className={getStatusColor(ETaskStatus.IN_PROGRESS)}>
                In Progress
              </Badge>
              <Badge className={getStatusColor(ETaskStatus.IN_REVIEW)}>
                In Review
              </Badge>
              <Badge className={getStatusColor(ETaskStatus.DONE)}>
                Done
              </Badge>
              <Badge className={getStatusColor(ETaskStatus.CANCELLED)}>
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
            <p className="text-muted-foreground">Loading tasks...</p>
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

