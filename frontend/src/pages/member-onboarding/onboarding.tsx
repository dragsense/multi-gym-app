// React
import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";

// Types
import type { IMembership } from "@shared/interfaces";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { AppLoader } from "@/components/layout-ui/app-loader";
import { OnboardingProgressIndicator } from "@/components/member-onboarding";
import { Button } from "@/components/ui/button";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useAuthUser } from "@/hooks/use-auth-user";

// Local components
import { ProfileStep } from "./steps/profile-step";
import { MembershipStep } from "./steps/membership-step";
import { PaymentStep } from "./steps/payment-step";

// Config
import { MEMBER_SEGMENT, ADMIN_ROUTES } from "@/config/routes.config";
import { buildRoutePath } from "@/lib/utils";

const STEPS = [
  { id: 1, name: "Profile", component: ProfileStep },
  { id: 2, name: "Membership", component: MembershipStep },
  { id: 3, name: "Payment", component: PaymentStep },
] as const;

export default function MemberOnboardingPage() {
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { user, isLoading } = useAuthUser();
  const navigate = useNavigate();

  const memberOnboardingStep = localStorage.getItem('member_onboarding_step');
  const memberOnboardingStepNumber = memberOnboardingStep ? parseInt(memberOnboardingStep) : 1;

  const [currentStep, setCurrentStep] = useState(memberOnboardingStepNumber);
  const [selectedMembership, setSelectedMembership] = useState<IMembership | null>(null);

  const handleStepComplete = (stepData?: any) => {
    if (currentStep === 1) {
      setCurrentStep(2);
      localStorage.setItem('member_onboarding_step', '2');
    } else if (currentStep === 2) {
      setSelectedMembership(stepData);
      setCurrentStep(3);
      localStorage.setItem('member_onboarding_step', '3');
    }
  };

  const handlePaymentSuccess = () => {
    localStorage.setItem('member_onboarding_step', '4');
    startTransition(() => {
      window.location.reload();
    });
  };

  const handlePaymentFailed = (retry: boolean) => {
    if (retry) {
      // Stay on payment step to retry
      return;
    } else {
      // Move to dashboard without payment
      localStorage.setItem('member_onboarding_step', '4');
      startTransition(() => {
        navigate(buildRoutePath(MEMBER_SEGMENT + "/" + ADMIN_ROUTES.DASHBOARD));
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      localStorage.setItem('member_onboarding_step', (currentStep - 1).toString());
    }
  };

  const handleSkip = () => {
    localStorage.setItem('member_onboarding_step', '4');
    startTransition(() => {
      navigate(buildRoutePath(MEMBER_SEGMENT + "/" + ADMIN_ROUTES.DASHBOARD));
    });
  };

  const CurrentStepComponent = STEPS.find(s => s.id === currentStep)?.component;
  const currentStepData = STEPS.find(s => s.id === currentStep);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AppLoader>
          <div className="text-center">
            <p className="text-muted-foreground">Loading user data...</p>
          </div>
        </AppLoader>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      
      <div className="max-w-4xl mx-auto">
        <OnboardingProgressIndicator
          steps={STEPS}
          currentStep={currentStep}
          stepName={currentStepData?.name}
          totalSteps={STEPS.length}
        />

          {CurrentStepComponent && (
            <CurrentStepComponent
              onComplete={handleStepComplete}
              onBack={currentStep > 1 ? handleBack : undefined}
              selectedMembership={selectedMembership}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailed={handlePaymentFailed}
            />
          )}

        <div className="flex justify-end mb-4">
          <Button variant="ghost" onClick={handleSkip}>
            Skip and Continue to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

