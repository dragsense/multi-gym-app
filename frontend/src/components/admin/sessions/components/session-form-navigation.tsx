import React, { useCallback, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/hooks/use-i18n";
import { EScheduleFrequency, EUserLevels } from "@shared/enums";
import { useAuthUser } from "@/hooks/use-auth-user";
import type {
  TSessionData,
  TUpdateSessionData,
} from "@shared/types/session.type";
import { FormErrors } from "@/components/shared-ui/form-errors";

interface SessionFormNavigationProps {
  currentStep: number;
  isEditing: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: (step: number) => void;
  onClose: () => void;
  onConfirm: (isRecurringSession: boolean, hasDateChanged: boolean) => void;
  componentId: string;
  oldValues: TSessionData | TUpdateSessionData | null;
}

export const SessionFormNavigation = React.memo(function SessionFormNavigation({
  currentStep,
  isEditing,
  isSubmitting,
  onPrevious,
  onNext,
  onClose,
  onConfirm,
  componentId,
  oldValues,
}: SessionFormNavigationProps) {
  const { t } = useI18n();
  const { user } = useAuthUser();

  // Use form values with react-hook-form watch()
  const { watch } = useFormContext<TSessionData | TUpdateSessionData>();
  const formValues = watch() as TSessionData | TUpdateSessionData | null;


  // Check if date/time has changed
  const hasDateChanged = React.useMemo(() => {
    if (!formValues?.startDateTime || !oldValues?.startDateTime) {
      return false;
    }
    const newDate = new Date(formValues.startDateTime);
    const oldDate = new Date(oldValues.startDateTime);

    // Compare date and time
    return newDate.getTime() !== oldDate.getTime();
  }, [formValues?.startDateTime, oldValues?.startDateTime]);



  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      // Validate step 1: title and type
      if (!formValues?.title || !formValues?.type) {
        return;
      }
      onNext(2);
    } else if (currentStep === 2) {
      // Validate step 2: trainer and members
      if (
        !formValues?.members?.length ||
        (!formValues?.trainer && user?.level !== EUserLevels.STAFF)
      ) {
        return;
      }
      onNext(3);
    } else if (currentStep === 3) {
      // Step 3 is now Additional Details - no validation needed, can proceed
      onNext(4);
    } else if (currentStep === 4) {
      // Validate step 4: startDateTime must be set (handled by SessionDateTimePicker)
      if (!formValues?.startDateTime) {
        return;
      }
      // Step 4 is the last step, no onNext needed
    }
  }, [currentStep, formValues, user, onNext]);

  const canProceedToNext = useMemo(() => {
    if (currentStep === 1) {
      return !!(formValues?.title && formValues?.type);
    } else if (currentStep === 2) {
      return !!(
        formValues?.members?.length &&
        (formValues?.trainer || user?.level === EUserLevels.STAFF)
      );
    } else if (currentStep === 3) {
      // Step 3 is Additional Details - always can proceed
      return true;
    } else if (currentStep === 4) {
      return !!formValues?.startDateTime;
    } else if (currentStep > 4) {
      return true;
    }
    return false;
  }, [currentStep, formValues, user]);

  const tooltipMessage = useMemo(() => {
    if (canProceedToNext) return null;

    if (currentStep === 1) {
      const missingFields: string[] = [];
      if (!formValues?.title) missingFields.push(t("title"));
      if (!formValues?.type) missingFields.push(t("type"));
      return `${t("please")} ${t("enter")} ${missingFields.join(
        ` ${t("and")} `
      )}`;
    } else if (currentStep === 2) {
      const missingFields: string[] = [];
      if (!formValues?.members?.length) missingFields.push(t("members"));
      if (!formValues?.trainer && user?.level !== EUserLevels.STAFF) {
        missingFields.push(t("trainer"));
      }
      return `${t("please")} ${t("select")} ${missingFields.join(
        ` ${t("and")} `
      )}`;
    } else if (currentStep === 4) {
      return `${t("please")} ${t("select")} ${t("start")} ${t("date")} ${t(
        "and"
      )} ${t("time")}`;
    }
    return null;
  }, [currentStep, formValues, user, canProceedToNext, t]);

  return (
    <div className="flex-1">
      <div className="flex justify-between gap-2">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              data-component-id={componentId}
            >
              {t("previous")}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            data-component-id={componentId}
          >
            {t("cancel")}
          </Button>
          {currentStep < 4 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!canProceedToNext}
                      data-component-id={componentId}
                    >
                      {t("next")}
                    </Button>
                  </div>
                </TooltipTrigger>
                {tooltipMessage && (
                  <TooltipContent>
                    <p>{tooltipMessage}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
          {(currentStep === 4 || isEditing) && (
            <Button
              type="button"
              disabled={isSubmitting || !canProceedToNext}
              onClick={(e) => {
                e.preventDefault();
                const isRecurringSession =
                  formValues?.recurrenceConfig?.frequency &&
                  formValues?.recurrenceConfig?.frequency !==
                  EScheduleFrequency.ONCE;

                onConfirm(isRecurringSession, hasDateChanged);
              }}
              data-component-id={componentId}
            >
              {isEditing ? t("update") : t("add")}
            </Button>
          )}
        </div>
      </div>
      <FormErrors />
    </div>
  );
});
