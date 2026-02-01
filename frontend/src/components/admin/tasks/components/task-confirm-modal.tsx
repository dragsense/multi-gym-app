import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";
import type { TCreateTaskData } from "@shared/interfaces/task.interface";
import { EScheduleFrequency, EDayOfWeek } from "@shared/enums/schedule.enum";
import { ETaskStatus, ETaskPriority } from "@shared/enums/task.enum";
import { useFormContext } from "react-hook-form";

interface TaskConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  isEditing: boolean;
  onConfirm: () => void;
}

export const TaskConfirmModal = React.memo(function TaskConfirmModal({
  open,
  onOpenChange,
  isSubmitting,
  isEditing,
  onConfirm,
}: TaskConfirmModalProps) {
  const { t } = useI18n();
  const { settings } = useUserSettings();

  const { getValues } = useFormContext<TCreateTaskData>();
  const formValues = getValues() as TCreateTaskData | null;

  // Helper function to format status
  const formatStatus = (status?: ETaskStatus) => {
    if (!status) return "-";
    const statusLabels: Record<ETaskStatus, string> = {
      [ETaskStatus.TODO]: "To Do",
      [ETaskStatus.IN_PROGRESS]: "In Progress",
      [ETaskStatus.IN_REVIEW]: "In Review",
      [ETaskStatus.DONE]: "Done",
      [ETaskStatus.CANCELLED]: "Cancelled",
    };
    return statusLabels[status] || status;
  };

  // Helper function to format priority
  const formatPriority = (priority?: ETaskPriority) => {
    if (!priority) return "-";
    const priorityLabels: Record<ETaskPriority, string> = {
      [ETaskPriority.LOW]: "Low",
      [ETaskPriority.MEDIUM]: "Medium",
      [ETaskPriority.HIGH]: "High",
      [ETaskPriority.URGENT]: "Urgent",
    };
    return priorityLabels[priority] || priority;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? buildSentence(t, "confirm", "task", "editing")
              : buildSentence(t, "confirm", "task", "creation")}
          </DialogTitle>

        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* General Information */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">
              {buildSentence(t, "general", "information")}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("title")}:</span>
                <p>{formValues?.title || "-"}</p>
              </div>
              {formValues?.status && (
                <div>
                  <span className="text-muted-foreground">{t("status")}:</span>
                  <p>{formatStatus(formValues.status)}</p>
                </div>
              )}
              {formValues?.priority && (
                <div>
                  <span className="text-muted-foreground">
                    {t("priority")}:
                  </span>
                  <p>{formatPriority(formValues.priority)}</p>
                </div>
              )}
              {formValues?.dueDate && (
                <div>
                  <span className="text-muted-foreground">
                    {buildSentence(t, "due", "date")}:
                  </span>
                  <p>
                    {formatDateTime(
                      formValues.dueDate as string | Date,
                      settings
                    )}
                  </p>
                </div>
              )}
              {formValues?.description && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">
                    {t("description")}:
                  </span>
                  <p>{formValues.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">
              {buildSentence(t, "assignment")}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {formValues?.assignedTo && (
                <div>
                  <span className="text-muted-foreground">
                    {buildSentence(t, "assigned", "to")}:
                  </span>
                  <p>
                    {formValues.assignedTo.firstName}{" "}
                    {formValues.assignedTo.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formValues.assignedTo.email}
                  </p>
                </div>
              )}
              {formValues?.tags && formValues.tags.length > 0 && (
                <div>
                  <span className="text-muted-foreground">{t("tags")}:</span>
                  <div className="space-y-1">
                    {formValues.tags.map((tag: string, index: number) => (
                      <p key={index}>{tag}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recurrence */}
          {formValues?.enableRecurrence &&
            formValues?.recurrenceConfig && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t("recurrence")}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      {buildSentence(t, "frequency")}:
                    </span>
                    <p capitalize>
                      {formValues.recurrenceConfig.frequency || "-"}
                    </p>
                  </div>
                  {formValues.recurrenceConfig.frequency ===
                    EScheduleFrequency.WEEKLY &&
                    formValues.recurrenceConfig.weekDays &&
                    formValues.recurrenceConfig.weekDays.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">
                          {buildSentence(t, "week", "days")}:
                        </span>
                        <p>
                          {formValues.recurrenceConfig.weekDays
                            .map((day: EDayOfWeek) => {
                              const dayNames = [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday",
                              ];
                              return dayNames[day];
                            })
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  {formValues.recurrenceConfig.frequency ===
                    EScheduleFrequency.MONTHLY &&
                    formValues.recurrenceConfig.monthDays &&
                    formValues.recurrenceConfig.monthDays.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">
                          {buildSentence(t, "month", "days")}:
                        </span>
                        <p>
                          {formValues.recurrenceConfig.monthDays.join(", ")}
                        </p>
                      </div>
                    )}
                  {formValues?.recurrenceEndDate && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        {buildSentence(t, "end", "date")}:
                      </span>
                      <p>
                        {formatDateTime(
                          formValues.recurrenceEndDate as string | Date,
                          settings
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

