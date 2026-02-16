import React, { type ReactNode } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type {
  TMemberData,
  TUpdateMemberData,
} from "@shared/types/member.type";
import type { FormInputs } from "@/hooks/use-input";

interface MemberFormStepsProps {
  currentStep: number;
  inputs: FormInputs<TMemberData | TUpdateMemberData>;
  isEditing: boolean;
}

export const MemberFormSteps = React.memo(function MemberFormSteps({
  currentStep,
  inputs,
  isEditing,
}: MemberFormStepsProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "basic", "information")}
          </h3>
          <div>
            
            {inputs.user}
          </div>
        </div>
      )}


      {/* Step 4: Member Details */}
      {currentStep === 2 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "member", "details")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.goal}
            {inputs.fitnessLevel}
            {inputs.medicalConditions}
          </div>
        </div>
      )}
    </div>
  );
});

