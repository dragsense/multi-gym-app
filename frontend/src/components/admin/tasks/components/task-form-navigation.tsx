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
import { EScheduleFrequency } from "@shared/enums";
import type { TCreateTaskData } from "@shared/interfaces/task.interface";
import { FormErrors } from "@/components/shared-ui/form-errors";

interface TaskFormNavigationProps {
  currentStep: number;
  isEditing: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: (step: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  componentId: string;
  oldValues?: TCreateTaskData | null;
}

export const TaskFormNavigation = React.memo(function TaskFormNavigation({
  currentStep,
  isEditing,
  isSubmitting,
  onPrevious,
  onNext,
  onClose,
  onConfirm,
  componentId,
  oldValues,
}: TaskFormNavigationProps) {
  const { t } = useI18n();

  // Use form values with react-hook-form watch()
  const { watch } = useFormContext<TCreateTaskData>();
  const formValues = watch() as TCreateTaskData | null;

  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      // Validate step 1: title and status
      if (!formValues?.title || !formValues?.status) {
        return;
      }
      onNext(2);
    } else if (currentStep === 2) {
      // Validate step 2: assignedTo must be selected
      if (!formValues?.assignedTo?.id) {
        return;
      }
      onNext(3);
    } else if (currentStep === 3) {
      // Validate step 3: startDateTime and dueDate must be set
      if (!formValues?.startDateTime || !formValues?.dueDate) {
        return;
      }
      onNext(4);
    }
  }, [currentStep, formValues, onNext]);

  const canProceedToNext = useMemo(() => {
    if (currentStep === 1) {
      return !!(formValues?.title && formValues?.status);
    } else if (currentStep === 2) {
      return !!formValues?.assignedTo?.id; // assignedTo is required
    } else if (currentStep === 3) {
      return !!(formValues?.startDateTime && formValues?.dueDate); // startDateTime and dueDate are required
    } else if (currentStep > 3) {
      return true;
    }
    return false;
  }, [currentStep, formValues]);

  const tooltipMessage = useMemo(() => {
    if (canProceedToNext) return null;

    if (currentStep === 1) {
      const missingFields: string[] = [];
      if (!formValues?.title) missingFields.push(t("title"));
      if (!formValues?.status) missingFields.push(t("status"));
      return `${t("please")} ${t("enter")} ${missingFields.join(
        ` ${t("and")} `
      )}`;
    } else if (currentStep === 2) {
      if (!formValues?.assignedTo?.id) {
        return `${t("please")} ${t("select")} ${t("user")}`;
      }
    } else if (currentStep === 3) {
      const missingFields: string[] = [];
      if (!formValues?.startDateTime) {
        missingFields.push(`${t("start")} ${t("date")} ${t("and")} ${t("time")}`);
      }
      if (!formValues?.dueDate) {
        missingFields.push(t("due") + " " + t("date"));
      }
      if (missingFields.length > 0) {
        return `${t("please")} ${t("select")} ${missingFields.join(` ${t("and")} `)}`;
      }
    }
    return null;
  }, [currentStep, formValues, canProceedToNext, t]);

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
          {currentStep < 3 && (
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
          {(currentStep >= 3 || isEditing) && (
            <Button
              type="button"
              disabled={isSubmitting || !canProceedToNext}
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              data-component-id={componentId}
            >
              {isEditing ? t("update") : t("create")}
            </Button>
          )}
        </div>
      </div>
      <FormErrors />
    </div>
  );
});

