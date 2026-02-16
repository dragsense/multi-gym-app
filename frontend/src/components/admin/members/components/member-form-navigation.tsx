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
import type { TMemberData, TUpdateMemberData } from "@shared/types/member.type";
import { FormErrors } from "@/components/shared-ui/form-errors";

interface MemberFormNavigationProps {
  currentStep: number;
  isEditing: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: (step: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  componentId: string;
}

export const MemberFormNavigation = React.memo(function MemberFormNavigation({
  currentStep,
  isEditing,
  isSubmitting,
  onPrevious,
  onNext,
  onClose,
  onConfirm,
  componentId,
}: MemberFormNavigationProps) {
  const { t } = useI18n();

  // Use form values with react-hook-form watch()
  const { watch } = useFormContext<TMemberData | TUpdateMemberData>();
  const formValues = watch() as TMemberData | TUpdateMemberData | null;

  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      // Validate step 1: basic user info (email, firstName, lastName)
      if (
        !formValues?.user?.email ||
        !formValues?.user?.firstName ||
        !formValues?.user?.lastName
      ) {
        return;
      }
      onNext(2);
    }
  }, [currentStep, formValues, onNext]);

  const canProceedToNext = useMemo(() => {
    if (currentStep === 1) {
      return !!(
        formValues?.user?.email &&
        formValues?.user?.firstName &&
        formValues?.user?.lastName
      );
    } else if (currentStep > 1) {
      return true;
    }
    return false;
  }, [currentStep, formValues]);

  const tooltipMessage = useMemo(() => {
    if (canProceedToNext) return null;

    if (currentStep === 1) {
      const missingFields: string[] = [];
      if (!formValues?.user?.email) missingFields.push(t("email"));
      if (!formValues?.user?.firstName) missingFields.push(t("firstName"));
      if (!formValues?.user?.lastName) missingFields.push(t("lastName"));
      return `${t("please")} ${t("enter")} ${missingFields.join(
        ` ${t("and")} `
      )}`;
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
          {currentStep < 2 && (
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
          {(currentStep >= 2 || isEditing) && (
            <Button
              type="button"
              disabled={isSubmitting || !canProceedToNext}
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
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

