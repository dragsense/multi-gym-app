import React, { type ReactNode } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { TBillingData } from "@shared/types/billing.type";
import type { FormInputs } from "@/hooks/use-input";

interface BillingFormStepsProps {
  currentStep: number;
  inputs: FormInputs<TBillingData>;
  isEditing: boolean;
  isPaidBilling?: boolean;
}

export const BillingFormSteps = React.memo(function BillingFormSteps({
  currentStep,
  inputs,
  isEditing,
  isPaidBilling = false,
}: BillingFormStepsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      {/* Step 1: General Information */}
      {currentStep === 1 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "billing", "information")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.title}
            {inputs.type}
          </div>
          <div className="mt-6">{inputs.description}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
            {inputs.issueDate}
            {inputs.dueDate}
          </div>
        </div>
      )}

      {/* Step 2: Line Items and Amount */}
      {currentStep === 2 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "line", "items")}
          </h3>
          {isPaidBilling && (
            <p className="text-sm text-muted-foreground mb-3 rounded-md bg-muted/50 p-3">
              {buildSentence(t, "PaidBillingAmountIsReadOnly")}
            </p>
          )}
          <div className="space-y-4">{inputs.lineItems as ReactNode}</div>
        </div>
      )}

      {/* Step 3: Additional Details */}
      {currentStep === 3 && (
        <>
          <div>
            <h3 className="text-sm font-semibold mb-3">{t("participants")}</h3>
            <div className="grid grid-cols-2 gap-6 items-start">
              {inputs.recipientUser as ReactNode}
            </div>
          </div>

          {/* Reminders */}
          <div>
            <div className="space-y-4">
              {inputs.enableReminder}
              {inputs.reminderConfig as ReactNode}
            </div>
          </div>

          {/* Payment Options */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              {buildSentence(t, "payment", "options")}
            </h3>
            <div className="space-y-4">{inputs.isCashable}</div>
          </div>
        </>
      )}
    </div>
  );
});
