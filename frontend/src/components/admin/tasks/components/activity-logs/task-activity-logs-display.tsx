// React & Hooks
import { useId } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { buildSentence } from "@/locales/translations";
import { formatDateTime } from "@/lib/utils";

// External libraries
import { Clock } from "lucide-react";

// Types
import { type ITaskActivityLog } from "@shared/interfaces/task.interface";

// UI Components
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ITaskActivityLogsDisplayProps {
  activityLogs: ITaskActivityLog[];
  isLoading?: boolean;
  error?: Error | null;
}

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case "task_created":
      return "✨";
    case "status_update":
      return "🔄";
    case "progress_update":
      return "📊";
    case "assignment_change":
      return "👤";
    case "priority_update":
      return "⚡";
    case "due_date_update":
      return "📅";
    case "task_update":
      return "✏️";
    default:
      return "📝";
  }
};

const getActivityColor = (activityType: string) => {
  switch (activityType) {
    case "task_created":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "status_update":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "progress_update":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case "assignment_change":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "priority_update":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "due_date_update":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
    case "task_update":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

export function TaskActivityLogsDisplay({
  activityLogs = [],
  isLoading = false,
  error = null,
}: ITaskActivityLogsDisplayProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();

  // Ensure activityLogs is always an array
  const logs = Array.isArray(activityLogs) ? activityLogs : [];

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
        {buildSentence(t, "failed", "to", "load", "activity", "logs")}
      </div>
    );
  }

  return (
    <div data-component-id={componentId} className="space-y-4">
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            {buildSentence(t, "no", "activity", "logs", "yet")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {buildSentence(t, "activity", "will", "appear", "here")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {logs.map((log) => {
            const user = log.user as any;
            const userName =
              user?.profile?.firstName && user?.profile?.lastName
                ? `${user.profile.firstName} ${user.profile.lastName}`
                : user?.email || "System";
            const userInitials = userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2);

            // Format activity type for display
            const activityTypeDisplay = log.activityType
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            return (
              <div
                key={log.id}
                className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Timeline indicator */}
                <div className="flex flex-col items-center shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.profile?.path}
                      alt={userName}
                    />
                    <AvatarFallback className="text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="w-0.5 h-full bg-border mt-2" />
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{userName}</span>
                    <Badge className={getActivityColor(log.activityType)}>
                      {getActivityIcon(log.activityType)} {activityTypeDisplay}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {log.createdAt && formatDateTime(log.createdAt, settings)}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{log.description}</p>
                  
                  {/* Show changed fields if available */}
                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(log.changes)
                        .filter(([field]) => {
                          // Filter out metadata fields
                          const metadataFields = ['taskId', 'changedFields'];
                          return !metadataFields.includes(field);
                        })
                        .map(([field, change]: [string, any]) => {
                          // Handle the change object structure
                          if (change && typeof change === 'object' && 'oldValue' in change && 'newValue' in change) {
                            const fieldName = field
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^\w/, (c) => c.toUpperCase())
                              .trim();
                            
                            const oldVal = change.oldValue === null || change.oldValue === undefined 
                              ? 'None' 
                              : String(change.oldValue);
                            const newVal = change.newValue === null || change.newValue === undefined 
                              ? 'None' 
                              : String(change.newValue);
                            
                            return (
                              <div key={field} className="text-xs text-muted-foreground">
                                <span className="font-medium">{fieldName}:</span>
                                {" "}
                                <span className="line-through">{oldVal}</span>
                                {" "}→{" "}
                                <span className="font-semibold text-foreground">{newVal}</span>
                              </div>
                            );
                          }
                          return null;
                        })
                        .filter(Boolean)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

