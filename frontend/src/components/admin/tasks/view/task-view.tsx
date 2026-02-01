// External Libraries
import { useShallow } from "zustand/shallow";
import { useId, useMemo, useTransition, useState } from "react";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Components
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  User,
  AlertCircle,
  Pencil,
  Trash2,
  Clock,
  MoreVertical,
  TrendingUp,
  BarChart3,
  X,
  MapPin,
} from "lucide-react";

// Types
import { type ITask } from "@shared/interfaces/task.interface";
import { ETaskStatus, ETaskPriority } from "@shared/enums/task.enum";

// Stores
import { type TSingleHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type ISingleHandlerState } from "@/@types/handler-types/single.type";

// Hooks & Utils
import { formatDate, formatDateTime } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useUserSettings } from "@/hooks/use-user-settings";

export type TTaskViewExtraProps = {};

type ITaskViewProps = THandlerComponentProps<
  TSingleHandlerStore<ITask, TTaskViewExtraProps>
>;

const priorityColors = {
  [ETaskPriority.LOW]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [ETaskPriority.MEDIUM]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  [ETaskPriority.HIGH]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  [ETaskPriority.URGENT]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors = {
  [ETaskStatus.TODO]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  [ETaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [ETaskStatus.IN_REVIEW]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  [ETaskStatus.DONE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  [ETaskStatus.CANCELLED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function TaskView({ storeKey, store }: ITaskViewProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: ISingleHandlerState<ITask, TTaskViewExtraProps>) => ({
      response: state.response,
      action: state.action,
      setAction: state.setAction,
      reset: state.reset,
    })
  );

  const storeState = store ? store(selector) : null;

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!storeState) {
    return null;
  }

  const { response: task, action, setAction, reset } = storeState;

  if (!task) {
    return null;
  }

  const handleCloseView = () => {
    startTransition(() => {
      reset();
      // Invalidate queries to refresh data when reopening
      queryClient.invalidateQueries({ queryKey: ["task", task?.id] });
      queryClient.invalidateQueries({ queryKey: ["task-comments", task?.id] });
      queryClient.invalidateQueries({ queryKey: ["task-issue-reports", task?.id] });
      queryClient.invalidateQueries({ queryKey: ["task-time-logs", task?.id] });
    });
  };

  const onEdit = (task: ITask) => {
    startTransition(() => {
      setAction("createOrUpdate", task.id);
    });
  };

  const onDelete = (task: ITask) => {
    startTransition(() => {
      setAction("delete", task.id);
    });
  };

  const onComplete = (task: ITask) => {
    startTransition(() => {
      setAction("completeTask", task.id);
    });
  };

  const onUpdateStatus = (task: ITask) => {
    startTransition(() => {
      setAction("updateStatus", task.id);
    });
  };

  const onUpdateProgress = (task: ITask) => {
    startTransition(() => {
      setAction("updateProgress", task.id);
    });
  };

  const onCancel = (task: ITask) => {
    startTransition(() => {
      setAction("cancel", task.id);
    });
  };

  return (
    <Dialog
      open={action === "view"}
      onOpenChange={handleCloseView}
      data-component-id={componentId}
    >
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "task", "details")}
          description={buildSentence(
            t,
            "view",
            "detailed",
            "information",
            "about",
            "this",
            "task"
          )}
        >
          <TaskDetailContent
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
            onUpdateStatus={onUpdateStatus}
            onUpdateProgress={onUpdateProgress}
            onCancel={onCancel}
            store={store}
          />
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

interface ITaskDetailContentProps {
  task: ITask;
  onEdit: (task: ITask) => void;
  onDelete: (task: ITask) => void;
  onComplete: (task: ITask) => void;
  onUpdateStatus: (task: ITask) => void;
  onUpdateProgress: (task: ITask) => void;
  onCancel: (task: ITask) => void;
  store: TSingleHandlerStore<ITask, TTaskViewExtraProps>;
}

export function TaskDetailContent({
  task,
  onEdit,
  onDelete,
  onComplete,
  onUpdateStatus,
  onUpdateProgress,
  onCancel,
  store,
}: ITaskDetailContentProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  // Get action from store to check if dialog is open
  const action = store((state) => state.action);
  const setAction = store((state) => state.setAction);

  const isOverdue = useMemo(() => {
    if (!task.dueDate || task.status === ETaskStatus.DONE) return false;
    return new Date(task.dueDate) < new Date();
  }, [task.dueDate, task.status]);

  const canMarkComplete = useMemo(() => {
    return task.status !== ETaskStatus.DONE && task.status !== ETaskStatus.CANCELLED;
  }, [task.status]);

  // Check if this is a calendar event
  const isCalendarEvent = task.id?.includes('@') || task.isCalendarEvent;

  // Check if task is in the future
  const isFutureEvent = useMemo(() => {
    if (!task.startDateTime) return false;
    return new Date(task.startDateTime) > new Date();
  }, [task.startDateTime]);


  // Refresh data when dialog opens
  useEffect(() => {
    if (action === "view" && task?.id) {
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
      queryClient.invalidateQueries({ queryKey: ["task-comments", task.id] });
      queryClient.invalidateQueries({ queryKey: ["task-issue-reports", task.id] });
      queryClient.invalidateQueries({ queryKey: ["task-time-logs", task.id] });
    }
  }, [action, task?.id, queryClient]);

  return (
    <div className="space-y-4" data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold truncate">
                {task.title}
              </h2>
              {isOverdue && (
                <Badge variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Overdue
                </Badge>
              )}
              <Badge className={statusColors[task.status]}>
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
            </div>
            <div className="flex items-center flex-wrap gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(task)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                {buildSentence(t, "edit")}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(task)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {buildSentence(t, "delete")}
              </Button>

        {/* More actions */}
        {!(isCalendarEvent && isFutureEvent) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdateStatus(task)}>
                <TrendingUp className="w-4 h-4 mr-2" />
                {buildSentence(t, "update", "status")}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onUpdateProgress(task)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                {buildSentence(t, "update", "progress")}
              </DropdownMenuItem>

              {task.status !== ETaskStatus.CANCELLED && (
                <DropdownMenuItem
                  onClick={() => onCancel(task)}
                  className="text-destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  {buildSentence(t, "cancel")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {task.assignedTo && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>
                {task.assignedTo.firstName || task.assignedTo.email}
              </span>
            </div>
          )}
          {task.startDateTime && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                {formatDateTime(task.startDateTime, settings)}
              </span>
            </div>
          )}
          <div
            className="flex items-center gap-2 cursor-pointer group hover:text-foreground transition-colors"
            onClick={() => onUpdateProgress(task)}
            title={buildSentence(t, "click", "to", "update", "progress")}
          >
            <Clock className="w-4 h-4" />
            <div className="flex items-center gap-2 flex-1 min-w-[150px]">
              <span className="text-xs whitespace-nowrap">Progress:</span>
              <div className="flex-1 relative">
                <Progress value={task.progress} className="h-2" subClassName={`bg-green-${task.progress}`} />
                <span className="absolute inset-4 flex items-center justify-center text-xs font-medium text-foreground">
                  {task.progress}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      {/* Task Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {buildSentence(t, "task", "information")}
          </h3>
          <div className="space-y-3">
            {task.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("location")}
                  </div>
                  <div className="font-medium">
                    {typeof task.location === 'string' 
                      ? task.location 
                      : task.location.name || task.location.address || t("location")}
                  </div>
                  {typeof task.location === 'object' && task.location.address && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {task.location.address}
                    </div>
                  )}
                </div>
              </div>
            )}
            {task.door && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    {t("door")}
                  </div>
                  <div className="font-medium">
                    {typeof task.door === 'string' 
                      ? task.door 
                      : task.door.name || t("door")}
                  </div>
                  {typeof task.door === 'object' && task.door.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {task.door.description}
                    </div>
                  )}
                </div>
              </div>
            )}
            {task.description && (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {t("description")}
                  </div>
                  <div className="text-sm">{task.description}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
