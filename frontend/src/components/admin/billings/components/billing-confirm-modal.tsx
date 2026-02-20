import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";
import type { TBillingData } from "@shared/types/billing.type";
import { EScheduleFrequency } from "@shared/enums/schedule.enum";
import {
  EReminderSendBefore,
  EReminderType,
} from "@shared/enums/reminder.enum";
import { useFormContext } from "react-hook-form";

interface BillingConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  isEditing: boolean;
  onConfirm: () => void;
}

export const BillingConfirmModal = React.memo(function BillingConfirmModal({
  open,
  onOpenChange,
  isSubmitting,
  isEditing,
  onConfirm,
}: BillingConfirmModalProps) {
  const { t } = useI18n();
  const { settings } = useUserSettings();

  const { watch } = useFormContext<TBillingData>();
  const formValues = watch() as TBillingData | null;

  // Calculate subtotal from line items (coerce to number in case form stores strings)
  const subtotal = React.useMemo(() => {
    if (formValues?.lineItems && formValues.lineItems.length > 0) {
      return formValues.lineItems.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0
      );
    }
    return 0;
  }, [formValues?.lineItems]);

  const taxRate = settings?.billing?.taxRate || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={
           isEditing
              ? buildSentence(t, "confirm", "billing editing")
              : buildSentence(t, "confirm", "billing creation")
          }
          description={
            isEditing
              ? buildSentence(t,"please review your changes before confirming.")
              : buildSentence(
                  t,"please review the billing details before confirming.")
          }
          footerContent={
            <>
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
            </>
          }
        >
          <div className="space-y-4">
          {/* General Information */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">
              {buildSentence(t, "general", "information")}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("title")}:</span>
                <p className="font-medium">{formValues?.title || "-"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t("type")}:</span>
                <p className="font-medium">{formValues?.type || "-"}</p>
              </div>
              {formValues?.description && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">
                    {t("description")}:
                  </span>
                  <p className="font-medium">{formValues.description}</p>
                </div>
              )}
              {formValues?.issueDate && (
                <div>
                  <span className="text-muted-foreground">
                    {buildSentence(t, "issue", "date")}:
                  </span>
                  <p className="font-medium">
                    {formatDateTime(formValues.issueDate, settings)}
                  </p>
                </div>
              )}
              {formValues?.dueDate && (
                <div>
                  <span className="text-muted-foreground">
                    {buildSentence(t, "due", "date")}:
                  </span>
                  <p className="font-medium">
                    {formatDateTime(formValues.dueDate, settings)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          {formValues?.lineItems && formValues.lineItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                {buildSentence(t, "line", "items")}
              </h4>
              <div className="space-y-2">
                {formValues.lineItems.map((item, index) => {
                  const itemTotal =
                    Number(item.quantity || 0) * Number(item.unitPrice || 0);
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-5 gap-4 text-sm p-2 bg-muted rounded"
                    >
                      <div className="col-span-2">
                        <span className="text-muted-foreground">
                          {t("description")}:
                        </span>
                        <p className="font-medium">{item.description || "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {t("quantity")}:
                        </span>
                        <p className="font-medium">{item.quantity || 0}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {buildSentence(t, "unit", "price")}:
                        </span>
                        <p className="font-medium">
                          {formatCurrency(
                            item.unitPrice || 0,
                            undefined,
                            undefined,
                            2,
                            2,
                            settings
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {buildSentence(t, "total", "price")}:
                        </span>
                        <p className="font-medium">
                          {formatCurrency(
                            itemTotal,
                            undefined,
                            undefined,
                            2,
                            2,
                            settings
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount Summary */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">
              {buildSentence(t, "payment", "summary")}
            </h4>
            <div className="space-y-2 text-sm p-4 bg-muted rounded">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {buildSentence(t, "subtotal")}:
                </span>
                <p className="font-medium">
                  {formatCurrency(
                    subtotal,
                    undefined,
                    undefined,
                    2,
                    2,
                    settings
                  )}
                </p>
              </div>
              {taxRate > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("tax")} ({taxRate}%):
                    </span>
                    <p className="font-medium">
                      {formatCurrency(
                        taxAmount,
                        undefined,
                        undefined,
                        2,
                        2,
                        settings
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>{t("total")}:</span>
                    <p>
                      {formatCurrency(
                        totalAmount,
                        undefined,
                        undefined,
                        2,
                        2,
                        settings
                      )}
                    </p>
                  </div>
                </>
              )}
              {taxRate === 0 && (
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>{t("total")}:</span>
                  <p>
                    {formatCurrency(
                      subtotal,
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

          {/* Recipient */}
          {formValues?.recipientUser && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">{t("recipient")}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("name")}:</span>
                  <p className="font-medium">
                    {formValues.recipientUser.firstName}{" "}
                    {formValues.recipientUser.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formValues.recipientUser.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recurrence */}
          {formValues?.recurrence &&
            formValues.recurrence !== EScheduleFrequency.ONCE && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t("recurrence")}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      {buildSentence(t, "frequency")}:
                    </span>
                    <p className="font-medium capitalize">
                      {formValues.recurrence || "-"}
                    </p>
                  </div>
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
                              <p key={minutes} className="font-medium">
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
                            <p key={type} className="font-medium capitalize">
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

          {/* Notes */}
          {formValues?.notes && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">{t("notes")}</h4>
              <p className="text-sm text-muted-foreground">
                {formValues.notes}
              </p>
            </div>
          )}

          {/* Payment Options */}
          {formValues?.isCashable && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                {buildSentence(t, "payment", "options")}
              </h4>
              <div className="text-sm">
                <span className="text-muted-foreground">
                  {buildSentence(t, "allow", "cash", "payment")}:
                </span>
                <p className="font-medium">{t("yes")}</p>
              </div>
            </div>
          )}
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
});
