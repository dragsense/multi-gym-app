// React
import { useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

// Types
import type { ISubscription } from "@shared/interfaces";
import type { PaymentCardFormData } from "@/@types/payment.types";
import { ESubscriptionFrequency } from "@shared/enums";

// Components
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AppCard } from "@/components/layout-ui/app-card";
import {
  StepNavigationButtons,
  PaymentSuccessDialog,
  PaymentErrorDialog,
  SubscriptionSummary,
} from "@/components/business-onboarding";
import {
  usePaymentProcessor,
  PaymentModalAdapter,
} from "@/payment-processors";

// Services
import { createBusinessSubscriptionBillingPaymentIntent } from "@/services/business/business-subscription-payment.api";
import { CreateBusinessSubscriptionPaymentIntentDto } from "@shared/dtos";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { usePaymentCards } from "@/hooks/use-payment-cards";
import { buildSentence } from "@/locales/translations";
// Calculate normalized price helper
const normalizeSubscriptionPrice = (
  price: number,
  frequency: ESubscriptionFrequency,
  discountPercentage?: number
): number => {
  let normalizedPrice = price;

  switch (frequency) {
    case ESubscriptionFrequency.WEEKLY:
      normalizedPrice = price / 4;
      break;
    case ESubscriptionFrequency.YEARLY:
      normalizedPrice = price * 12;
      break;
    case ESubscriptionFrequency.MONTHLY:
    default:
      normalizedPrice = price;
      break;
  }

  if (discountPercentage && discountPercentage > 0) {
    normalizedPrice = normalizedPrice * (1 - discountPercentage / 100);
  }

  return normalizedPrice;
};

interface ISelectedSubscription {
  plan: ISubscription;
  frequency: ESubscriptionFrequency;
}

interface IPaymentStepProps {
  onComplete: () => void;
  onBack?: () => void;
  businessData: {
    name: string;
    subdomain: string;
    businessId: string;
    paymentProcessorId?: string | null;
    paymentProcessorType?: string | null;
  } | null;
  selectedSubscription: ISelectedSubscription | null;
  onPaymentSuccess: () => void;
  onPaymentFailed: (retry: boolean) => void;
}

export function PaymentStep({
  onBack,
  businessData,
  selectedSubscription,
  onPaymentSuccess,
  onPaymentFailed,
}: IPaymentStepProps) {
  const { t } = useI18n();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { cards, isLoadingPaymentCards } = usePaymentCards();

  const { mutate: processPayment, isPending: isProcessingPayment } = useMutation({
    mutationFn: (data: CreateBusinessSubscriptionPaymentIntentDto) =>
      createBusinessSubscriptionBillingPaymentIntent(data),
    onSuccess: () => {
      setShowSuccessDialog(true);
      setTimeout(() => {
        handleSuccessContinue();
      }, 1000);
      setShowPaymentModal(false);
    },
    onError: (error: Error) => {
      const message = error?.message || buildSentence(t, "payment", "failed");
      setErrorMessage(message);
      setShowErrorDialog(true);
      setShowPaymentModal(false);
    },
  });

  const handlePayClick = useCallback(
    async (paymentMethodId?: string, cardData?: PaymentCardFormData) => {
      if (!selectedSubscription || !businessData) {
        setErrorMessage("Please complete previous steps first");
        setShowErrorDialog(true);
        return;
      }

      const paymentData: CreateBusinessSubscriptionPaymentIntentDto = {
        businessId: businessData.businessId,
        subscriptionId: selectedSubscription.plan.id,
        frequency: selectedSubscription.frequency,
        paymentMethodId: paymentMethodId || undefined,
        saveForFutureUse: cardData?.saveForFutureUse || false,
        setAsDefault: cardData?.saveAsDefault || false,
      };

      processPayment(paymentData);
    },
    [selectedSubscription, businessData, processPayment]
  );

  const handleProceedToPayment = useCallback(() => {
    setShowPaymentModal(true);
  }, []);

  useEffect(() => {
    if (!selectedSubscription || !businessData) {
      onBack?.();
    }
  }, [selectedSubscription, businessData, onBack]);

  const totalAmount = selectedSubscription?.plan.price
    ? normalizeSubscriptionPrice(
      selectedSubscription.plan.price,
      selectedSubscription.frequency,
      selectedSubscription.plan.discountPercentage
    )
    : 0;

  const handleRetry = () => {
    setShowErrorDialog(false);
    setShowPaymentModal(true);
    onPaymentFailed(true);
  };

  const handleContinueLater = () => {
    setShowErrorDialog(false);
    onPaymentFailed(false);
  };

  const handleSuccessContinue = () => {
    setShowSuccessDialog(false);
    onPaymentSuccess();
  };

  if (!selectedSubscription || !businessData) {
    return (
      <AppCard>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please complete previous steps first.</p>
          {onBack && (
            <div className="mt-4">
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          )}
        </div>
      </AppCard>
    );
  }

  return (
    <div className="space-y-6">
      <AppCard footer={
        <StepNavigationButtons
          onBack={onBack}
          onContinue={handleProceedToPayment}
          continueLabel="Proceed to Payment"
          continueDisabled={
            isLoadingPaymentCards ||
            isProcessingPayment
          }
          continueLoading={isProcessingPayment}
          showBack={!!onBack}
        />
      }>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Review your subscription details above and proceed to payment when ready.
          </div>

          {/* Business Information */}
          <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
            <h3 className="font-semibold text-base">Business Information</h3>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">Name:</span>{" "}
                <span className="font-medium">{businessData.name}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Subdomain:</span>{" "}
                <span className="font-medium">{businessData.subdomain}</span>
              </p>
            </div>
          </div>

          {/* Subscription Summary */}
          <SubscriptionSummary
            subscription={selectedSubscription.plan}
            frequency={selectedSubscription.frequency}
          />
        </div>
      </AppCard>

      <PaymentModalAdapter
        cards={cards}
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onPay={handlePayClick}
        isLoading={isProcessingPayment}
        amount={totalAmount}
        error={errorMessage}
        showSaveOptions={false}
      />

      <PaymentSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onContinue={handleSuccessContinue}
      />

      <PaymentErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        errorMessage={errorMessage}
        onRetry={handleRetry}
        onContinueLater={handleContinueLater}
      />
    </div>
  );
}
