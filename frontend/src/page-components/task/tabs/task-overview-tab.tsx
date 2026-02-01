import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Tag, Repeat, Clock } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ITask } from "@shared/interfaces/task.interface";
import type { TSingleHandlerStore } from "@/stores";
import { ETaskStatus } from "@shared/enums/task.enum";
import { EScheduleFrequency } from "@shared/enums/schedule.enum";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface ITaskOverviewTabProps {
  task: ITask;
  store: TSingleHandlerStore<ITask, any>;
}

export function TaskOverviewTab({ task }: ITaskOverviewTabProps) {
  const { t } = useI18n();
  const isOverdue = useMemo(() => {
    if (!task.dueDate || task.status === ETaskStatus.DONE) return false;
    return new Date(task.dueDate) < new Date();
  }, [task.dueDate, task.status]);

  const dueDays = useMemo(() => {
    if (!task.startDateTime || !task.dueDate) return null;
    const start = new Date(task.startDateTime);
    const due = new Date(task.dueDate);
    const diffTime = due.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [task.startDateTime, task.dueDate]);

  return (
    <div className="space-y-4">
      {task.description && (
        <div className="space-y-2 pb-4 border-b">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Description
          </h3>
          <p className="text-sm whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {task.startDateTime && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {buildSentence(t, "start", "date", "time")}
              </h3>
            </div>
            <p className="text-sm font-medium">
              {formatDateTime(task.startDateTime)}
            </p>
          </div>
        )}

        {task.dueDate && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {buildSentence(t, "due", "date")}
              </h3>
            </div>
            <p className={cn("text-sm font-medium", isOverdue && "text-red-600")}>
              {formatDateTime(task.dueDate)}
              {isOverdue && <span className="ml-2 text-xs">(Overdue)</span>}
            </p>
          </div>
        )}

        {dueDays !== null && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {buildSentence(t, "due", "days")}
              </h3>
            </div>
            <p className="text-sm font-medium">
              {dueDays === 0 
                ? buildSentence(t, "due", "today")
                : dueDays === 1
                ? buildSentence(t, "due", "in", "1", "day")
                : dueDays > 1
                ? `${buildSentence(t, "due", "in")} ${dueDays} ${buildSentence(t, "days")}`
                : `${Math.abs(dueDays)} ${Math.abs(dueDays) === 1 ? buildSentence(t, "day") : buildSentence(t, "days")} ${buildSentence(t, "overdue")}`
              }
            </p>
          </div>
        )}

        {task.assignedTo && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Assigned To
              </h3>
            </div>
            <p className="text-sm font-medium">
              {task.assignedTo.firstName} {task.assignedTo.lastName}
            </p>
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Tags
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recurrence */}
      {task.enableRecurrence && task.recurrenceConfig && (
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {buildSentence(t, "recurrence")}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                {buildSentence(t, "frequency")}
              </div>
              <div className="text-sm font-medium capitalize">
                {task.recurrenceConfig.frequency || "-"}
              </div>
            </div>
            {task.recurrenceConfig.frequency === EScheduleFrequency.WEEKLY &&
              task.recurrenceConfig.weekDays &&
              task.recurrenceConfig.weekDays.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "week", "days")}
                  </div>
                  <div className="text-sm font-medium">
                    {task.recurrenceConfig.weekDays
                      .map((day) => {
                        const dayNames = [
                          t("sunday"),
                          t("monday"),
                          t("tuesday"),
                          t("wednesday"),
                          t("thursday"),
                          t("friday"),
                          t("saturday"),
                        ];
                        return dayNames[day];
                      })
                      .join(", ")}
                  </div>
                </div>
              )}
            {task.recurrenceConfig.frequency === EScheduleFrequency.MONTHLY &&
              task.recurrenceConfig.monthDays &&
              task.recurrenceConfig.monthDays.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {buildSentence(t, "month", "days")}
                  </div>
                  <div className="text-sm font-medium">
                    {task.recurrenceConfig.monthDays.join(", ")}
                  </div>
                </div>
              )}
            {task.recurrenceEndDate && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {buildSentence(t, "end", "date")}
                </div>
                <div className="text-sm font-medium">
                  {formatDate(task.recurrenceEndDate)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

