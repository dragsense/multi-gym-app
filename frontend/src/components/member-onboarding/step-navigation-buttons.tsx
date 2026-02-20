// React
import { useId } from "react";

// Components
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface IStepNavigationButtonsProps {
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  showBack?: boolean;
  continueType?: "button" | "submit";
}

export function StepNavigationButtons({
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  continueLoading = false,
  showBack = true,
  continueType = "button",
}: IStepNavigationButtonsProps) {
  const componentId = useId();

  return (
    <div className="flex justify-between  w-full pt-4" data-component-id={componentId}>
      {showBack && onBack && (
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}
      {(onContinue || continueType === "submit") && (
        <Button
          type={continueType}
          onClick={continueType === "button" && onContinue ? onContinue : undefined}
          disabled={continueDisabled || continueLoading}
          className="ml-auto"
        >
          {continueLoading ? (
            <>
              <span className="mr-2">Processing...</span>
            </>
          ) : (
            <>
              {continueLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

