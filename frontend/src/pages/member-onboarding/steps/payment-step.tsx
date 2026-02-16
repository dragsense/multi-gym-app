// React
import { useTransition, useState, useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

// Types
import type { IMembership } from "@shared/interfaces";
import type { StripeCardFormData } from "@/@types/payment.types";
import { EPaymentPreference } from "@shared/enums/membership.enum";

// Components
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AppCard } from "@/components/layout-ui/app-card";
import { StripePaymentModal } from "@/components/shared-ui/stripe-payment-modal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  MembershipSummary,
  StepNavigationButtons,
  PaymentSuccessDialog,
  PaymentErrorDialog,
} from "@/components/member-onboarding";

// Services
import { createMemberMembershipBillingPaymentIntent } from "@/services/membership/membership-payment.api";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import { CreateMemberMembershipPaymentIntentDto } from "@shared/dtos";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useStripePaymentCards } from "@/hooks/use-stripe-payment-cards";
import { buildSentence } from "@/locales/translations";

interface IPaymentStepProps {
  onComplete: () => void;
  onBack?: () => void;
  selectedMembership: IMembership | null;
  onPaymentSuccess: () => void;
  onPaymentFailed: (retry: boolean) => void;
}


export function PaymentStep({
  onBack,
  selectedMembership,
  onPaymentSuccess,
  onPaymentFailed,
}: IPaymentStepProps) {
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  // Determine available payment preferences from membership
  const availablePaymentPreferences = selectedMembership?.paymentPreference || [EPaymentPreference.CASH, EPaymentPreference.ONLINE];
  const defaultPreference = availablePaymentPreferences.includes(EPaymentPreference.CASH) 
    ? EPaymentPreference.CASH 
    : availablePaymentPreferences[0] || EPaymentPreference.ONLINE;
  const [paymentPreference, setPaymentPreference] = useState<EPaymentPreference>(defaultPreference);
  
  // Check if terms and conditions exist
  const hasTermsAndConditions = !!selectedMembership?.termsAndConditions;
  
  const { stripeCards, isLoadingPaymentCards } = useStripePaymentCards();

  const { mutate: processPayment, isPending: isProcessingPayment } = useMutation({
    mutationFn: (data: CreateMemberMembershipPaymentIntentDto) => createMemberMembershipBillingPaymentIntent(data),
    onSuccess: () => {
      setShowSuccessDialog(true);
      setShowPaymentModal(false);
    },
    onError: (error: Error) => {
      const message = error?.message || buildSentence(t, "payment", "failed");
      setErrorMessage(message);
      setShowErrorDialog(true);
      setShowPaymentModal(false);
    },
  });

  // Determine if continue button should be disabled
  const isContinueDisabled = isLoadingPaymentCards || isProcessingPayment;

  const handlePayClick = useCallback(
    async (paymentMethodId?: string, cardData?: StripeCardFormData) => {
      if (!selectedMembership) {
        setErrorMessage("Please select a membership first");
        setShowErrorDialog(true);
        return;
      }

      const paymentData: CreateMemberMembershipPaymentIntentDto = {
        membershipId: selectedMembership.id,
        paymentPreference,
        paymentMethodId: paymentMethodId || undefined,
        saveForFutureUse: cardData?.saveForFutureUse || false,
        setAsDefault: cardData?.saveAsDefault || false,
      };

      processPayment(paymentData);
    },
    [selectedMembership, processPayment, paymentPreference]
  );

  const handleProceedToPayment = useCallback(() => {
    if (paymentPreference === EPaymentPreference.CASH) {
      // For cash payments, directly create billing without card
      handlePayClick();
    } else {
      // For online payments, show card modal
      setShowPaymentModal(true);
    }
  }, [paymentPreference, handlePayClick]);

  useEffect(() => {
    if (!selectedMembership) {
      onBack?.();
    } else {
      // Update payment preference based on available options
      const available = selectedMembership.paymentPreference || [EPaymentPreference.CASH, EPaymentPreference.ONLINE];
      const defaultPref = available.includes(EPaymentPreference.CASH) 
        ? EPaymentPreference.CASH 
        : available[0] || EPaymentPreference.ONLINE;
      
      // Only update if current preference is not available
      if (!available.includes(paymentPreference)) {
        setPaymentPreference(defaultPref);
      }
    
    }
  }, [selectedMembership, paymentPreference, onBack]);

  const totalAmount =
    (Number(selectedMembership?.price) || 0) +
    (Number(selectedMembership?.signupFee) || 0);

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

  if (!selectedMembership) {
    return (
      <AppCard>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please select a membership first.</p>
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
          continueLabel={paymentPreference === EPaymentPreference.CASH ? "Create Billing" : "Proceed to Payment"}
          continueDisabled={isContinueDisabled}
          continueLoading={isProcessingPayment}
          showBack={!!onBack}
        />
      }>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Review your membership details above and proceed to payment when ready.
          </div>

          <MembershipSummary 
            membership={selectedMembership} 
          />

          {/* Payment Preference Selection */}
          {availablePaymentPreferences.length > 1 && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-medium">
                {buildSentence(t, "payment", "preference")}
              </Label>
              <RadioGroup
                value={paymentPreference}
                onValueChange={(value) => setPaymentPreference(value as EPaymentPreference)}
              >
                {availablePaymentPreferences.includes(EPaymentPreference.CASH) && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={EPaymentPreference.CASH} id="cash" />
                    <Label htmlFor="cash" className="font-normal cursor-pointer">
                      {buildSentence(t, "cash")}
                    </Label>
                  </div>
                )}
                {availablePaymentPreferences.includes(EPaymentPreference.ONLINE) && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={EPaymentPreference.ONLINE} id="online" />
                    <Label htmlFor="online" className="font-normal cursor-pointer">
                      {buildSentence(t, "online")}
                    </Label>
                  </div>
                )}
              </RadioGroup>
              {paymentPreference === EPaymentPreference.CASH && (
                <p className="text-sm text-muted-foreground">
                  Billing will be created and you can pay later at the facility.
                </p>
              )}
            </div>
          )}
        </div>
      </AppCard>

      <StripePaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        stripeCards={stripeCards}
        onPay={handlePayClick}
        isLoading={isProcessingPayment}
        amount={totalAmount}
        showSaveOptions={false}
        error={errorMessage}
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

