// React
import { useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";

// Types
import type { ISubscription } from "@shared/interfaces";
import { ESubscriptionFrequency } from "@shared/enums";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { AppLoader } from "@/components/layout-ui/app-loader";
import { OnboardingProgressIndicator } from "@/components/business-onboarding";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useMyBusiness } from "@/hooks/use-my-business";

// Local components
import { BusinessSetupStep } from "./steps/business-setup-step";
import { SubscriptionStep } from "./steps/subscription-step";
import { PaymentStep } from "./steps/payment-step";

// Config
import { ADMIN_SEGMENT, ADMIN_ROUTES } from "@/config/routes.config";
import { buildRoutePath } from "@/lib/utils";

const STEPS = [
  { id: 1, name: "Business Setup", component: BusinessSetupStep },
 /*  { id: 2, name: "Subscription", component: SubscriptionStep },
  { id: 3, name: "Payment", component: PaymentStep }, */
] as const;

interface IBusinessData {
  businessId: string;
  name: string;
  subdomain: string;
  paymentProcessorId?: string | null;
  paymentProcessorType?: string | null;
}

interface ISelectedSubscription {
  plan: ISubscription;
  frequency: ESubscriptionFrequency;
}

export default function BusinessOnboardingPage() {
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { user, isLoading } = useAuthUser();
  const { business, isLoading: isBusinessLoading } = useMyBusiness();
  const navigate = useNavigate();

  const businessOnboardingStep = localStorage.getItem("business_onboarding_step");
  const businessOnboardingStepNumber = businessOnboardingStep ? parseInt(businessOnboardingStep) : 1;

  const [currentStep, setCurrentStep] = useState(businessOnboardingStepNumber);
  const [businessData, setBusinessData] = useState<IBusinessData | null>(
    business?.id
      ? {
          businessId: business.id,
          name: business.name,
          subdomain: business.subdomain,
          paymentProcessorId: business.paymentProcessorId ?? undefined,
          paymentProcessorType: undefined,
        }
      : null
  );
  const [selectedSubscription, setSelectedSubscription] = useState<ISelectedSubscription | null>(null);

  const handleStepComplete = (stepData?: any) => {
    if (currentStep === 1) {
      setBusinessData(stepData);
      setCurrentStep(2);
      handlePaymentSuccess();
      localStorage.setItem("business_onboarding_step", "2");
    } else if (currentStep === 2) {
      setSelectedSubscription(stepData);
      setCurrentStep(3);
      localStorage.setItem("business_onboarding_step", "3");
    }
  };

  const handlePaymentSuccess = () => {
    localStorage.setItem("business_onboarding_step", "4");
    startTransition(() => {
      window.location.reload();
    });
  };

  const handlePaymentFailed = (retry: boolean) => {
    if (retry) return;
    localStorage.setItem("business_onboarding_step", "4");
    window.location.reload();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      localStorage.setItem("business_onboarding_step", (currentStep - 1).toString());
    }
  };

  const handleSkip = () => {
    localStorage.setItem("business_onboarding_step", "4");
    startTransition(() => {
      navigate(buildRoutePath(ADMIN_SEGMENT + "/" + ADMIN_ROUTES.DASHBOARD));
    });
  };

  const CurrentStepComponent = STEPS.find((s) => s.id === currentStep)?.component;
  const currentStepData = STEPS.find((s) => s.id === currentStep);

  if (isLoading || isBusinessLoading || !user) {
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
            businessData={businessData}
            existingBusiness={business}
            selectedSubscription={selectedSubscription}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailed={handlePaymentFailed}
          />  
        )}
      </div>
    </div>
  );
}
