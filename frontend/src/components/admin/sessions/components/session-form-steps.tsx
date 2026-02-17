import React, { type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type {
  TSessionData,
  TUpdateSessionData,
} from "@shared/types/session.type";
import type { FormInputs } from "@/hooks/use-input";
import { useFormContext } from "react-hook-form";
import { formatCurrency } from "@shared/lib/format.utils";

interface SessionFormStepsProps {
  currentStep: number;
  inputs: FormInputs<TSessionData | TUpdateSessionData>;
  isEditing: boolean;
  limits?: {
    maxClientsPerSession?: number;
  };
}

export const SessionFormSteps = React.memo(function SessionFormSteps({
  currentStep,
  inputs,
  isEditing,
  limits,
}: SessionFormStepsProps) {
  const { t } = useI18n();

  const { getValues } = useFormContext<TSessionData | TUpdateSessionData>();
  const formValues = getValues() as (TSessionData | TUpdateSessionData) | null;

  return (  
    <div className="space-y-8">
      {/* Step 1: General Information */}
      {currentStep === 1 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "session", "information")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.title}
            {inputs.type}
          </div>
          <div className="mt-6">{inputs.description}</div>
          {/* <div className="mt-6">{inputs.location}</div> */}
        </div>
      )}

      {/* Step 2: Participants */}
      {currentStep === 2 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">{t("participants")}</h3>
          <div className="grid grid-cols-2 gap-6 items-start">
            {inputs.trainer as ReactNode}
            {inputs.members as ReactNode}
          </div>
          {limits?.maxClientsPerSession && formValues?.members && (
            <Alert
              className={`mt-4 ${formValues.members.length > limits.maxClientsPerSession
                  ? "border-red-500"
                  : "border-blue-500"
                }`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {formValues.members.length > limits.maxClientsPerSession ? (
                  <span className="text-red-600">
                    {buildSentence(
                      t,
                      "maximum",
                      limits.maxClientsPerSession.toString(),
                      "members",
                      "allowed",
                      "per",
                      "session"
                    )}{" "}
                    {buildSentence(
                      t,
                      "you",
                      "selected",
                      formValues.members.length.toString(),
                      "members"
                    )}
                  </span>
                ) : (
                  <span className="text-blue-600">
                    {buildSentence(
                      t,
                      formValues.members.length.toString(),
                      "of",
                      limits.maxClientsPerSession.toString(),
                      "members",
                      "selected"
                    )}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Step 3: Additional Details - Service Offers, Price, Notes, Reminders */}
      {currentStep === 3 && (
        <>
          {/* Price */}
          {isEditing && <div>
            <h3 className="text-sm font-semibold mb-3">{buildSentence(t, "selected", "price")}:  {formatCurrency(formValues?.price || 0)}</h3>
          </div>}
          {/* Service Offer (Optional) */}
          <div>
            <h3 className="text-sm font-semibold mb-3">
              {buildSentence(t, "service", "offer")} ({t("optional")})
            </h3>
            <div className="mb-6">
              {inputs.serviceOffer as ReactNode}
            </div>
          </div>

          {/* Price Options */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t("pricing")}</h3>
            <div className="space-y-4">
              {inputs.useCustomPrice}
              {formValues?.useCustomPrice && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {inputs.customPrice}
                </div>
              )}
              
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t("notes")}</h3>
            <div className="mt-6">{inputs.notes}</div>
          </div>

          {/* Reminders */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t("reminders")}</h3>
            <div className="space-y-4">
              {inputs.enableReminder}
              {inputs.reminderConfig as ReactNode}
            </div>
          </div>
        </>
      )}

      {/* Step 4: Date & Time Slots */}
      {currentStep === 4 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "date", "and", "time")}
          </h3>
          <div className="space-y-6">
            {inputs.duration}
            {inputs.startDateTime}
          </div>

          {/* Recurrence Options */}
          {
            <div className="mt-6 space-y-4 border-t pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {!isEditing && inputs.enableRecurrence}
                  {formValues?.enableRecurrence && inputs.recurrenceEndDate}
                </div>
                {formValues?.enableRecurrence &&
                  (inputs.recurrenceConfig as ReactNode)}
              </div>
            </div>
          }
        </div>
      )}
    </div>
  );
});
