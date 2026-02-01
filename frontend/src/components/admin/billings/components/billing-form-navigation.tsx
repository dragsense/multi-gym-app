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
import type { TBillingData } from "@shared/types/billing.type";
import { FormErrors } from "@/components/shared-ui/form-errors";
import { buildSentence } from "@/locales/translations";
interface BillingFormNavigationProps {
  currentStep: number;
  isEditing: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: (step: number) => void;
  onClose: () => void;
  onConfirm: () => void;
  componentId: string;
}

export const BillingFormNavigation = React.memo(function BillingFormNavigation({
  currentStep,
  isEditing,
  isSubmitting,
  onPrevious,
  onNext,
  onClose,
  onConfirm,
  componentId,
}: BillingFormNavigationProps) {
  const { t } = useI18n();

  // Use form values with react-hook-form watch()
  const { watch } = useFormContext<TBillingData>();
  const formValues = watch() as TBillingData | null;

  const handleNext = useCallback(() => {
    if (currentStep === 1) {
      // Validate step 1: title and type
      if (!formValues?.title || !formValues?.type) {
        return;
      }
      onNext(2);
    } else if (currentStep === 2) {
      // Validate step 2: line items required
      if (!formValues?.lineItems || formValues.lineItems.length === 0) {
        return;
      }
      onNext(3);
    }
  }, [currentStep, formValues, onNext]);


//------------------------Added New Method to restrict step2 to proceed until all fields fills-------
  const hasValidLineItem = (items?: TBillingData["lineItems"]) => {
  if (!Array.isArray(items)) return false;
  return items.some(item => {
    const unitPrice = Number(item.unitPrice);
    const quantity = Number(item.quantity);
    const description=String(item.description??"").trim();
    return (
      Number.isFinite(unitPrice) &&
      unitPrice > 0 &&
      Number.isFinite(quantity) &&
      quantity > 0 &&
      description.length>0
    );
  });
};
//---------------------------------------------------------------------------------------
  const canProceedToNext = useMemo(() => {
    if (currentStep === 1) {
      return !!(formValues?.title && formValues?.type);
    } else if (currentStep === 2) {
       return hasValidLineItem(formValues?.lineItems);
    } else if (currentStep > 2) {
      return true;
    }
    return false;
  }, [currentStep, formValues]);

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
      //return `${t("please")} ${t("add")} ${t("line")} ${t("items")} ${t(
      //  "and"
      //)} ${t("enter")} ${t("amount")} $`;
      return buildSentence(t, "please fill all fields")
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
              {isEditing ? t("update") : t("add")}
            </Button>
          )}
        </div>
      </div>
      <FormErrors />
    </div>
  );
});
