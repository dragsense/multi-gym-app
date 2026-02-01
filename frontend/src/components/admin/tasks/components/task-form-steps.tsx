import React, { type ReactNode } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { TCreateTaskData } from "@shared/interfaces/task.interface";
import type { FormInputs } from "@/hooks/use-input";
import { useFormContext } from "react-hook-form";

interface TaskFormStepsProps {
  currentStep: number;
  inputs: FormInputs<TCreateTaskData>;
  isEditing: boolean;
}

export const TaskFormSteps = React.memo(function TaskFormSteps({
  currentStep,
  inputs,
  isEditing,
}: TaskFormStepsProps) {
  const { t } = useI18n();

  const { getValues } = useFormContext<TCreateTaskData>();
  const formValues = getValues() as TCreateTaskData | null;

  return (
    <div className="space-y-8">
      {/* Step 1: General Information */}
      {currentStep === 1 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "task", "information")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.title}
            {inputs.status}
          </div>
          <div className="mt-6">{inputs.description}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
            {inputs.priority}
          </div>
        </div>
      )}

      {/* Step 2: Assignment */}
      {currentStep === 2 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "assignment")}
          </h3>
          <div className="space-y-6">
            {inputs.assignedTo as ReactNode}
            {inputs.tags}
          </div>
        </div>
      )}

      {/* Step 3: Date & Time and Recurrence */}
      {currentStep === 3 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "date", "and", "time")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputs.startDateTime}
            {inputs.dueDate}
          </div>

          {/* Recurrence Options */}
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
        </div>
      )}
    </div>
  );
});

