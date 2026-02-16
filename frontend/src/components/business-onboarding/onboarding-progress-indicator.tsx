// React
import { useId } from "react";
import React from "react";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface IOnboardingProgressIndicatorProps {
  steps: ReadonlyArray<{ id: number; name: string }>;
  currentStep: number;
  stepName?: string;
  totalSteps?: number;
}

export function OnboardingProgressIndicator({
  steps,
  currentStep,
  stepName,
  totalSteps,
}: IOnboardingProgressIndicatorProps) {
  const componentId = useId();

  return (
    <AppCard
      className="mb-2"
      header={
        stepName && totalSteps ? (
          <div>
            <h2 className="text-2xl font-semibold">{stepName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="relative flex items-center w-full">
          {/* Background connector line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
          
          {/* Steps with equal spacing */}
          <div className="relative flex w-full justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center relative z-10">
                {/* Connector line to next step */}
                {index < steps.length - 1 && (
                  <div
                    className="absolute top-5 left-1/2 w-full h-0.5 "
                    style={{ width: `calc(100% - 2.5rem)` }}
                  />
                )}
                
                {/* Step circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background ${
                    currentStep > step.id
                      ? "border-primary text-primary-foreground bg-primary"
                      : currentStep === step.id
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>
                
                {/* Step label */}
                <span
                  className={`mt-2 text-sm text-center whitespace-nowrap ${
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Progress value={(currentStep / steps.length) * 100} className="h-2" />
      </div>
    </AppCard>
  );
}
