// React & Hooks
import { useId } from "react";

// External libraries
import { MoreHorizontal, Edit, Trash2, Eye, AlertCircle, Repeat } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AppCard } from "@/components/layout-ui/app-card";

// Types
import type { ITask } from "@shared/interfaces/task.interface";
import { ETaskStatus, ETaskPriority } from "@shared/enums/task.enum";
import { EScheduleFrequency } from "@shared/enums/schedule.enum";
import type { ColumnDef } from "@tanstack/react-table";
import type { IUserSettings } from "@shared/interfaces/settings.interface";

// Utils
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ITaskItemViewsProps {
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  handleView: (id: string) => void;
  isOverdue: (task: ITask) => boolean;
  priorityColors: Record<ETaskPriority, string>;
  statusColors: Record<ETaskStatus, string>;
  settings?: IUserSettings;
  componentId?: string;
}

export function taskItemViews({
  handleEdit,
  handleDelete,
  handleView,
  isOverdue,
  priorityColors,
  statusColors,
  settings,
  componentId = "task-item-views",
}: ITaskItemViewsProps) {
  const columns: ColumnDef<ITask>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{task.title}</span>
            {isOverdue(task) && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={statusColors[status]}>
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.original.priority;
        return (
          <Badge className={priorityColors[priority]}>
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assignedTo",
      header: "Assigned To",
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        return assignedTo
          ? assignedTo.firstName || assignedTo.email || "Unassigned"
          : "Unassigned";
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        if (!dueDate) return "—";
        const date = new Date(dueDate);
        const overdue = isOverdue(row.original);
        return (
          <span className={cn(overdue && "text-red-600 font-semibold")}>
            {formatDate(dueDate, settings)}
          </span>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        return `${row.original.progress}%`;
      },
    },
    {
      id: "recurrence",
      header: "Recurrence",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div className="flex items-center gap-2">
            <Repeat
              className={`h-4 w-4 ${task.enableRecurrence
                ? "text-blue-600"
                : "text-muted-foreground"
                }`}
            />
            <Badge
              variant={task.enableRecurrence ? "default" : "outline"}
            >
              {task.enableRecurrence ? "Yes" : "No"}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "frequency",
      header: "Frequency",
      cell: ({ row }) => {
        const task = row.original;
        const recurrenceConfig = task.recurrenceConfig;
        const frequency = recurrenceConfig?.frequency || EScheduleFrequency.ONCE;
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(task.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(task.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(task.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const listItem = (task: ITask) => {
    return (
      <AppCard
        key={task.id}
        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleView(task.id)}
        data-component-id={componentId}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {task.title}
              {isOverdue(task) && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Badge className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
            <Badge className={statusColors[task.status]}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {task.assignedTo && (
              <span>
                Assigned to: {task.assignedTo.firstName || task.assignedTo.email}
              </span>
            )}
            {task.dueDate && (
              <span className={cn(isOverdue(task) && "text-red-600 font-semibold")}>
                Due: {formatDate(task.dueDate, settings)}
              </span>
            )}
          </div>
          <span>Progress: {task.progress}%</span>
        </div>
        {task.enableRecurrence && task.recurrenceConfig && (
          <div className="flex items-center gap-2 mt-2">
            <Repeat
              className={`h-4 w-4 ${task.enableRecurrence
                ? "text-blue-600"
                : "text-muted-foreground"
                }`}
            />
            <Badge variant={task.enableRecurrence ? "default" : "outline"}>
              {task.enableRecurrence ? "Recurring" : "One-time"}
            </Badge>
            {task.recurrenceConfig.frequency && (
              <Badge variant="outline">
                {task.recurrenceConfig.frequency.charAt(0).toUpperCase() + task.recurrenceConfig.frequency.slice(1)}
              </Badge>
            )}
          </div>
        )}
        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {task.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </AppCard>
    );
  };

  return { columns, listItem };
}

