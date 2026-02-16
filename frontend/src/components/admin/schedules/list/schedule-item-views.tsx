import { Eye, Pencil, Trash2, Clock, Calendar } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useId, useMemo, useTransition } from "react";

// Types
import { type ISchedule } from "@shared/interfaces/schedule.interface";

// Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Enums
import { EScheduleStatus, EScheduleFrequency } from "@shared/enums";

// Utils
import { formatTimeOfDay, formatInterval } from "@/utils/date-format";
import { formatDate, formatTime } from "@/lib/utils";
import type { IUserSettings } from "@shared/interfaces/settings.interface";

interface IItemViewArgs {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
  settings?: IUserSettings;
  componentId?: string;
}

const getStatusColor = (status: EScheduleStatus) => {
  switch (status) {
    case EScheduleStatus.ACTIVE:
      return "bg-green-100 text-green-800 border-green-200";
    case EScheduleStatus.PAUSED:
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case EScheduleStatus.COMPLETED:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case EScheduleStatus.FAILED:
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getFrequencyIcon = (frequency: EScheduleFrequency) => {
  switch (frequency) {
    case EScheduleFrequency.DAILY:
      return "📆";
    case EScheduleFrequency.WEEKLY:
      return "📅";
    case EScheduleFrequency.MONTHLY:
      return "🗓️";
    case EScheduleFrequency.YEARLY:
      return "📋";
    default:
      return "⏱️";
  }
};

export const scheduleItemViews = ({
  handleEdit,
  handleDelete,
  handleView,
  settings,
  componentId = "schedule-item-views",
}: IItemViewArgs) => {
  // React 19: Essential IDs and transitions
  const [, startTransition] = useTransition();
  const columns: ColumnDef<ISchedule>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span className="font-medium">#{row.original.id}</span>,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.title}</span>
          <span className="text-xs text-muted-foreground">{row.original.action}</span>
        </div>
      ),
    },
    {
      accessorKey: "frequency",
      header: "Frequency",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{getFrequencyIcon(row.original.frequency)}</span>
          <span className="text-sm capitalize">{row.original.frequency}</span>
        </div>
      ),
    },
    {
      accessorKey: "nextRunDate",
      header: "Next Run",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {formatDate(row.original.nextRunDate, settings)}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {row.original.timeOfDay && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeOfDay(row.original.timeOfDay)}
              </span>
            )}
            {row.original.interval && (
              <span className="flex items-center gap-1">
                ⏱️ {formatInterval(row.original.intervalValue || row.original.interval, row.original.intervalUnit)}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={getStatusColor(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "executionCount",
      header: "Executions",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span>✅ {row.original.successCount}/{row.original.executionCount}</span>
          {row.original.failureCount > 0 && (
            <span className="text-red-600">❌ {row.original.failureCount}</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2" data-component-id={componentId}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => handleView(row.original.id))}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => handleEdit(row.original.id))}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => handleDelete(row.original.id))}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const listItem = (item: ISchedule) => {
    // React 19: Memoized formatted date for better performance
    const nextRunDate = useMemo(() => formatDate(item.nextRunDate, settings), [item.nextRunDate, settings]);
    
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-md transition-shadow" data-component-id={componentId}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xl">{getFrequencyIcon(item.frequency)}</span>
          <span className="font-semibold text-lg">{item.title}</span>
          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Next: {nextRunDate}
          </span>
          {item.timeOfDay && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimeOfDay(item.timeOfDay)}
              {item.endTime && ` - ${formatTimeOfDay(item.endTime)}`}
            </span>
          )}
          {item.interval && (
            <span className="flex items-center gap-1">
              ⏱️ {formatInterval(item.intervalValue || item.interval, item.intervalUnit)}
            </span>
          )}
          <span>
            ✅ {item.successCount}/{item.executionCount} runs
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Action: <span className="font-mono">{item.action}</span>
          {item.entityId && <span> | Entity ID: {item.entityId}</span>}
          {item.timezone && <span> | TZ: {item.timezone}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTransition(() => handleView(item.id))}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTransition(() => handleEdit(item.id))}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTransition(() => handleDelete(item.id))}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
      </div>
    );
  };

  return { columns, listItem };
};

