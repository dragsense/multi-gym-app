// React & Hooks
import { useId, useTransition, useCallback, useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { buildSentence } from "@/locales/translations";
import { formatDateTime } from "@/lib/utils";
import { useRegisteredStore } from "@/stores/store-registry";

// External libraries
import { Plus, Edit, Trash2, Clock } from "lucide-react";

// Types
import { type ITaskTimeLog } from "@shared/interfaces/task.interface";
import type { TSingleHandlerStore } from "@/stores";

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/layout-ui/app-alert-dialog";

interface ITaskTimeLogsDisplayProps {
  taskId: string;
  storeKey: string;
  timeLogs: ITaskTimeLog[];
  isLoading?: boolean;
  error?: Error | null;
  onRefetch: () => void;
  onDelete: (timeLogId: string) => Promise<void>;
}

export function TaskTimeLogsDisplay({
  taskId,
  storeKey,
  timeLogs = [],
  isLoading = false,
  error = null,
  onRefetch,
  onDelete,
}: ITaskTimeLogsDisplayProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const [, startTransition] = useTransition();

  // Get store using store key
  const singleStore = useRegisteredStore<TSingleHandlerStore<ITaskTimeLog, any>>(
    storeKey + "-single"
  );

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timeLogToDelete, setTimeLogToDelete] = useState<string | null>(null);

  const handleDeleteClick = useCallback((timeLogId: string) => {
    setTimeLogToDelete(timeLogId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (timeLogToDelete) {
      try {
        await onDelete(timeLogToDelete);
        startTransition(() => {
          onRefetch();
        });
        setDeleteDialogOpen(false);
        setTimeLogToDelete(null);
      } catch (error) {
        console.error("Failed to delete time log:", error);
      }
    }
  }, [timeLogToDelete, onDelete, onRefetch]);



//Updated to handle edit time log
const handleEdit = useCallback(
  (timeLog: ITaskTimeLog) => {
    if (!singleStore) return;

    startTransition(() => {
      singleStore.getState().setExtra("taskId", taskId);
      singleStore.getState().setExtra("timeLog", timeLog); // 👈 key
      singleStore.getState().setAction("createOrUpdate");
    });
  },
  [singleStore, taskId]
);



  const handleCreate = useCallback(() => {
    if (singleStore) {
      startTransition(() => {
        singleStore.getState().setExtra("taskId", taskId);
        singleStore.getState().setAction("createOrUpdate");
      });
    }
  }, [singleStore]);

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        {buildSentence(t, "failed", "to", "load", "time", "logs")}
      </div>
    );
  }

  return (
    <div data-component-id={componentId} className="space-y-4">
      {/* Add Time Log Button */}
      <div className="flex justify-end">
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {buildSentence(t, "add", "time", "log")}
        </Button>
      </div>

      {/* Time Logs List */}
      {timeLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            {buildSentence(t, "no", "time", "logs", "yet")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {buildSentence(t, "start", "tracking", "your", "time")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {timeLogs.map((timeLog) => {
            const userName =
              timeLog.user?.firstName && timeLog.user?.lastName
                ? `${timeLog.user.firstName} ${timeLog.user.lastName}`
                : timeLog.user?.email || "Unknown User";
            const userInitials = userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2);

            return (
              <div
                key={timeLog.id}
                className="flex gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage
                    src={(timeLog.user as any)?.profile?.avatar}
                    alt={userName}
                  />
                  <AvatarFallback className="text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                {/* Time Log Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{userName}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(timeLog.duration)}
                      </span>
                      {timeLog.startTime && (
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(timeLog.startTime, settings)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEdit(timeLog)} //now directly passing timelog insted of passing jsut timlog id
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(timeLog.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {timeLog.description && (
                    <div className="text-sm whitespace-pre-wrap break-words text-foreground">
                      {timeLog.description}
                    </div>
                  )}

                  {/* Start Time */}
                  {timeLog.startTime && (
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(timeLog.startTime, settings)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={buildSentence(t, "delete", "time", "log")}
        description={buildSentence(
          t,
          "are",
          "you",
          "sure",
          "you",
          "want",
          "to",
          "delete",
          "this",
          "time",
          "log"
        )}
        confirmText={buildSentence(t, "delete")}
        cancelText={buildSentence(t, "cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

