import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepperProps {
  currentStep: number
  steps: Array<{ label: string; description?: string }>
  className?: string
}

function Stepper({ currentStep, steps, className }: StepperProps) {
  return (
    <div data-slot="stepper" className={cn("w-full", className)}>
      <ol className="flex w-full items-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          const isLast = index === steps.length - 1

          return (
            <React.Fragment key={index}>
              <li className={cn("flex items-center")}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      (isCompleted || isActive) &&
                      "border-primary bg-primary text-primary-foreground",
                      !isCompleted &&
                      !isActive &&
                      "border-muted-foreground bg-background text-muted-foreground",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">
                        {stepNumber}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              </li>
              {!isLast && (
                <li className="mx-4 flex-1">
                  <div
                    className={cn(
                      "h-0.5 w-full transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted",
                    )}
                  />
                </li>
              )}
            </React.Fragment>
          )
        })}
      </ol>
    </div>
  )
}

export { Stepper }

