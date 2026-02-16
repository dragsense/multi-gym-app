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
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";
import type {
  TSessionData,
  TUpdateSessionData,
} from "@shared/types/session.type";
import type { MemberDto } from "@shared/dtos";
import { EScheduleFrequency, EDayOfWeek } from "@shared/enums/schedule.enum";
import {
  EReminderSendBefore,
  EReminderType,
} from "@shared/enums/reminder.enum";
import { EUpdateSessionScope } from "@shared/enums";
import { useFormContext } from "react-hook-form";

interface SessionConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  isEditing: boolean;
  onConfirm: () => void;
}

export const SessionConfirmModal = React.memo(function SessionConfirmModal({
  open,
  onOpenChange,
  isSubmitting,
  isEditing,
  onConfirm,
}: SessionConfirmModalProps) {
  const { t } = useI18n();
  const { settings } = useUserSettings();

  const { getValues } = useFormContext<TSessionData | TUpdateSessionData>();
  const formValues = getValues() as TSessionData | TUpdateSessionData | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? buildSentence(t, "confirm", "session", "editing")
              : buildSentence(t, "confirm", "session", "creation")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? buildSentence(t, "confirm", "session", "editing")
              : buildSentence(t, "confirm", "session", "creation")}
          </DialogDescription>
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
              <div>
                <span className="text-muted-foreground">{t("type")}:</span>
                <p>{formValues?.type || "-"}</p>
              </div>
              {formValues?.location && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">
                    {t("location")}:
                  </span>
                  <p>{formValues.location}</p>
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

          {/* Participants */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{t("participants")}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {formValues?.trainer && (
                <div>
                  <span className="text-muted-foreground">{t("trainer")}:</span>
                  <p>
                    {formValues.trainer.user?.firstName}{" "}
                    {formValues.trainer.user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formValues.trainer.user?.email}
                  </p>
                </div>
              )}
              {formValues?.members && formValues.members.length > 0 && (
                <div>
                  <span className="text-muted-foreground">{t("members")}:</span>
                  <div className="space-y-1">
                    {formValues.members.map((member: MemberDto) => (
                      <p key={member.id}>
                        {member.user?.firstName} {member.user?.lastName}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">
              {buildSentence(t, "date", "and", "time")}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {formValues?.startDateTime && (
                <div>
                  <span className="text-muted-foreground">{t("date")}:</span>
                  <p>{formatDateTime(formValues.startDateTime, settings)}</p>
                </div>
              )}

              {formValues?.duration && (
                <div>
                  <span className="text-muted-foreground">
                    {t("duration")}:
                  </span>
                  <p>
                    {formValues.duration} {t("minutes")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          {formValues?.price && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">{t("details")}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formValues?.price && (
                  <div>
                    <span className="text-muted-foreground">{t("price")}:</span>
                    <p>
                      {formatCurrency(
                        formValues.price,
                        undefined,
                        undefined,
                        2,
                        2,
                        settings
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recurrence */}
          {(formValues?.updateScope === undefined ||
            formValues?.updateScope === EUpdateSessionScope.ALL) &&
            formValues?.enableRecurrence &&
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
                  {formValues.recurrenceConfig.endDate && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">
                        {buildSentence(t, "end", "date")}:
                      </span>
                      <p>
                        {formatDateTime(
                          formValues.recurrenceConfig.endDate,
                          settings
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Reminders */}
          {formValues?.enableReminder && formValues?.reminderConfig && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">{t("reminders")}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formValues.reminderConfig.sendBefore &&
                  formValues.reminderConfig.sendBefore.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">
                        {buildSentence(t, "send", "before")}:
                      </span>
                      <div className="space-y-1">
                        {formValues.reminderConfig.sendBefore.map(
                          (minutes: EReminderSendBefore) => {
                            const sendBeforeLabels: Record<
                              EReminderSendBefore,
                              string
                            > = {
                              [EReminderSendBefore.ONE_MINUTE]: "1 Minute",
                              [EReminderSendBefore.TEN_MINUTES]: "10 Minutes",
                              [EReminderSendBefore.THIRTY_MINUTES]:
                                "30 Minutes",
                              [EReminderSendBefore.ONE_HOUR]: "1 Hour",
                              [EReminderSendBefore.THREE_HOURS]: "3 Hours",
                              [EReminderSendBefore.ONE_DAY]: "1 Day",
                              [EReminderSendBefore.THREE_DAYS]: "3 Days",
                            };
                            return (
                              <p key={minutes}>
                                {sendBeforeLabels[minutes] ||
                                  `${minutes} minutes`}
                              </p>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
                {formValues.reminderConfig.reminderTypes &&
                  formValues.reminderConfig.reminderTypes.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">
                        {buildSentence(t, "reminder", "types")}:
                      </span>
                      <div className="space-y-1">
                        {formValues.reminderConfig.reminderTypes.map(
                          (type: EReminderType) => (
                            <p key={type} capitalize>
                              {type.toLowerCase()}
                            </p>
                          )
                        )}
                      </div>
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
