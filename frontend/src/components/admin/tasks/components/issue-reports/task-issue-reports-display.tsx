// React & Hooks
import { useId, useTransition, useCallback, useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { buildSentence } from "@/locales/translations";
import { formatDateTime } from "@/lib/utils";
import { useRegisteredStore } from "@/stores/store-registry";

// External libraries
import { Plus, Edit, Trash2, Bug, AlertCircle } from "lucide-react";

// Types
import { type ITaskIssueReport } from "@shared/interfaces/task.interface";
import { EIssueReportStatus, EIssueReportSeverity } from "@shared/enums/task.enum";
import type { TSingleHandlerStore } from "@/stores";

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/layout-ui/app-alert-dialog";

interface ITaskIssueReportsDisplayProps {
  taskId: string;
  storeKey: string;
  issueReports: ITaskIssueReport[];
  isLoading?: boolean;
  error?: Error | null;
  onRefetch: () => void;
  onDelete: (issueReportId: string) => Promise<void>;
}

const severityColors = {
  [EIssueReportSeverity.LOW]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [EIssueReportSeverity.MEDIUM]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  [EIssueReportSeverity.HIGH]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  [EIssueReportSeverity.CRITICAL]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors = {
  [EIssueReportStatus.OPEN]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  [EIssueReportStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [EIssueReportStatus.RESOLVED]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  [EIssueReportStatus.CLOSED]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  [EIssueReportStatus.DUPLICATE]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

export function TaskIssueReportsDisplay({
  taskId,
  storeKey,
  issueReports = [],
  isLoading = false,
  error = null,
  onRefetch,
  onDelete,
}: ITaskIssueReportsDisplayProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const [, startTransition] = useTransition();

  // Get store using store key
  const singleStore = useRegisteredStore<TSingleHandlerStore<ITaskIssueReport, any>>(
    storeKey + "-single"
  );

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [issueReportToDelete, setIssueReportToDelete] = useState<string | null>(null);

  const handleDeleteClick = useCallback((issueReportId: string) => {
    setIssueReportToDelete(issueReportId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (issueReportToDelete) {
      try {
        await onDelete(issueReportToDelete);
        startTransition(() => {
          onRefetch();
        });
        setDeleteDialogOpen(false);
        setIssueReportToDelete(null);
      } catch (error) {
        console.error("Failed to delete issue report:", error);
      }
    }
  }, [issueReportToDelete, onDelete, onRefetch]);

  const handleEdit = useCallback(
    (issueReportId: string) => {
      if (singleStore) {
        startTransition(() => {
          singleStore.getState().setExtra("taskId", taskId);
          singleStore.getState().setAction("createOrUpdate", issueReportId);
        });
      }
    },
    [singleStore]
  );

  const handleCreate = useCallback(() => {
    if (singleStore) {
      startTransition(() => {
        singleStore.getState().setExtra("taskId", taskId);
        singleStore.getState().setAction("createOrUpdate");
      });
    }
  }, [singleStore]);

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
        {buildSentence(t, "failed", "to", "load", "issue", "reports")}
      </div>
    );
  }

  return (
    <div data-component-id={componentId} className="space-y-4">
      {/* Add Issue Report Button */}
      <div className="flex justify-end">
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {buildSentence(t, "add", "issue", "report")}
        </Button>
      </div>

      {/* Issue Reports List */}
      {issueReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Bug className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            {buildSentence(t, "no", "issue", "reports", "yet")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {buildSentence(t, "report", "issues", "you", "encounter")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {issueReports.map((issueReport) => {
            const userName =
              issueReport.reportedBy?.firstName && issueReport.reportedBy?.lastName
                ? `${issueReport.reportedBy.firstName} ${issueReport.reportedBy.lastName}`
                : issueReport.reportedBy?.email || "Unknown User";
            const userInitials = userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2);

            return (
              <div
                key={issueReport.id}
                className="flex gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage
                    src={(issueReport.reportedBy as any)?.profile?.avatar}
                    alt={userName}
                  />
                  <AvatarFallback className="text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                {/* Issue Report Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold truncate">{issueReport.title}</h3>
                        <Badge className={severityColors[issueReport.severity]}>
                          {issueReport.severity}
                        </Badge>
                        <Badge className={statusColors[issueReport.status]}>
                          {issueReport.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{userName}</span>
                        {issueReport.createdAt && (
                          <>
                            <span>•</span>
                            <span>{formatDateTime(issueReport.createdAt, settings)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEdit(issueReport.id)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(issueReport.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="text-sm whitespace-pre-wrap break-words text-foreground">
                    {issueReport.description}
                  </div>
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
        title={buildSentence(t, "delete", "issue", "report")}
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
          "issue",
          "report"
        )}
        confirmText={buildSentence(t, "delete")}
        cancelText={buildSentence(t, "cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

