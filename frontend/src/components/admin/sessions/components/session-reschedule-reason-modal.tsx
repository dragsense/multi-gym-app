import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type {
  TSessionData,
  TUpdateSessionData,
} from "@shared/types/session.type";

interface SessionRescheduleReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setShowUpdateScopeModal: (show: boolean) => void;
  setShowConfirmModal: (show: boolean) => void;
  isRecurringSession: boolean;
}

export const SessionRescheduleReasonModal = React.memo(
  function SessionRescheduleReasonModal({
    open,
    onOpenChange,
    setShowUpdateScopeModal,
    setShowConfirmModal,
    isRecurringSession,
  }: SessionRescheduleReasonModalProps) {
    const { t } = useI18n();
    const { watch, setValue } = useFormContext<TSessionData | TUpdateSessionData>();
    const formValues = watch() as TSessionData | TUpdateSessionData | null;

    const handleContinue = useCallback(() => {
      onOpenChange(false);
      if (isRecurringSession) {
        setShowUpdateScopeModal(true);
      } else {
        setShowConfirmModal(true);
      }
    }, [onOpenChange, isRecurringSession, setShowConfirmModal, setShowUpdateScopeModal]);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <AppDialog
            title={
              <DialogTitle>
                {buildSentence(t, "reschedule", "reason")}
              </DialogTitle>
            }
            description={buildSentence(
              t,
              "please",
              "provide",
              "a",
              "reason for rescheduling",
              "this session",
            )}
            footerContent={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t("cancel")}
                </Button>
                <Button type="button" onClick={handleContinue}>
                  {t("Continue")}
                </Button>
              </>
            }
          >
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reschedule-reason">
                  {buildSentence(t, "reason")} ({t("optional")})
                </Label>
                <Textarea
                  id="reschedule-reason"
                  placeholder={buildSentence(
                    t,
                    "enter",
                    "reason",
                    "for",
                    "rescheduling"
                  )}
                  value={formValues?.dateChangeReason || ""}
                  onChange={(e) => {
                    setValue(
                      "dateChangeReason" as keyof TUpdateSessionData,
                      e.target.value
                    );
                  }}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </AppDialog>
        </DialogContent>
      </Dialog>
    );
  }
);

