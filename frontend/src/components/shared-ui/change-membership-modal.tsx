// React
import { useState, useCallback, useEffect } from "react";

// Types
import type { IMembership } from "@shared/interfaces";
import type { StripePaymentCard, StripeCardFormData } from "@/@types/payment.types";
import { EPaymentPreference } from "@shared/enums/membership.enum";

// Components
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { MembershipCard } from "@/components/shared-ui/membership-card";
import { MembershipSummary } from "@/components/member-onboarding/membership-summary";
import { StripePaymentModal } from "@/components/shared-ui/stripe-payment-modal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

type TStep = "select" | "summary";

export interface IChangeMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberships: IMembership[];
  isLoadingMemberships?: boolean;
  stripeCards: StripePaymentCard[];
  isLoadingPaymentCards?: boolean;
  isProcessingPayment?: boolean;
  onPayment: (
    membership: IMembership,
    paymentPreference: EPaymentPreference,
    paymentMethodId?: string,
    cardData?: StripeCardFormData
  ) => void;
}

/**
 * UI Component for changing membership
 * Pure presentation component - receives data and callbacks as props
 */
export function ChangeMembershipModal({
  open,
  onOpenChange,
  memberships,
  isLoadingMemberships = false,
  stripeCards,
  isLoadingPaymentCards = false,
  isProcessingPayment = false,
  onPayment,
}: IChangeMembershipModalProps) {
  const { t } = useI18n();

  // State
  const [step, setStep] = useState<TStep>("select");
  const [selectedMembership, setSelectedMembership] = useState<IMembership | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPreference, setPaymentPreference] = useState<EPaymentPreference>(EPaymentPreference.CASH);

  // Determine available payment preferences from selected membership
  const availablePaymentPreferences = selectedMembership?.paymentPreference || [
    EPaymentPreference.CASH,
    EPaymentPreference.ONLINE,
  ];

  // Update payment preference when membership changes
  useEffect(() => {
    if (selectedMembership) {
      const available = selectedMembership.paymentPreference || [
        EPaymentPreference.CASH,
        EPaymentPreference.ONLINE,
      ];
      const defaultPref = available.includes(EPaymentPreference.CASH)
        ? EPaymentPreference.CASH
        : available[0] || EPaymentPreference.ONLINE;

      if (!available.includes(paymentPreference)) {
        setPaymentPreference(defaultPref);
      }
    }
  }, [selectedMembership, paymentPreference]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setStep("select");
    setSelectedMembership(null);
    setShowPaymentModal(false);
    setPaymentPreference(EPaymentPreference.CASH);
    onOpenChange(false);
  }, [onOpenChange]);

  // Handle payment
  const handlePayClick = useCallback(
    (paymentMethodId?: string, cardData?: StripeCardFormData) => {
      if (!selectedMembership) return;
      onPayment(selectedMembership, paymentPreference, paymentMethodId, cardData);
    },
    [selectedMembership, paymentPreference, onPayment]
  );

  // Handle proceed to payment
  const handleProceedToPayment = useCallback(() => {
    if (paymentPreference === EPaymentPreference.CASH) {
      // For cash payments, directly create billing without card
      handlePayClick();
    } else {
      // For online payments, show card modal
      setShowPaymentModal(true);
    }
  }, [paymentPreference, handlePayClick]);

  // Calculate total amount
  const totalAmount = selectedMembership
    ? (Number(selectedMembership.calculatedPrice) || 0) +
      (Number(selectedMembership.signupFee) || 0)
    : 0;

  // Step 1: Select Membership
  const renderSelectStep = () => (
    <AppDialog
      title={buildSentence(t, "select", "membership")}
      description={buildSentence(t, "choose", "the", "membership", "plan", "that", "best", "fits", "your", "needs")}
      footerContent={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="outline" onClick={handleClose}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => setStep("summary")}
            disabled={!selectedMembership}
          >
            {t("continue")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      }
    >
      {isLoadingMemberships ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : memberships.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {buildSentence(t, "no", "memberships", "available")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
          {memberships.map((membership) => (
            <MembershipCard
              key={membership.id}
              membership={membership}
              isSelected={selectedMembership?.id === membership.id}
              onClick={() => setSelectedMembership(membership)}
            />
          ))}
        </div>
      )}

      {selectedMembership && (
        <div className="text-sm text-muted-foreground mt-4 pt-4 border-t">
          {t("selected")}: <span className="font-medium">{selectedMembership.title}</span>
        </div>
      )}
    </AppDialog>
  );

  // Step 2: Summary & Payment
  const renderSummaryStep = () => (
    <AppDialog
      title={buildSentence(t, "membership", "summary")}
      description={buildSentence(t, "review", "your", "membership", "details")}
      footerContent={
        <div className="flex justify-between gap-2 w-full">
          <Button variant="outline" onClick={() => setStep("select")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("back")}
          </Button>
          <Button
            onClick={handleProceedToPayment}
            disabled={isProcessingPayment || isLoadingPaymentCards}
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("processing")}...
              </>
            ) : (
              <>
                {paymentPreference === EPaymentPreference.CASH
                  ? buildSentence(t, "create", "billing")
                  : buildSentence(t, "proceed", "to", "payment")}
                <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      }
    >
      {selectedMembership && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <MembershipSummary membership={selectedMembership} />

          {/* Payment Preference Selection */}
          {availablePaymentPreferences.length > 1 && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-base font-medium">
                {buildSentence(t, "payment", "preference")}
              </Label>
              <RadioGroup
                value={paymentPreference}
                onValueChange={(value) =>
                  setPaymentPreference(value as EPaymentPreference)
                }
              >
                {availablePaymentPreferences.includes(EPaymentPreference.CASH) && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={EPaymentPreference.CASH} id="cash-change" />
                    <Label htmlFor="cash-change" className="font-normal cursor-pointer">
                      {buildSentence(t, "cash")}
                    </Label>
                  </div>
                )}
                {availablePaymentPreferences.includes(EPaymentPreference.ONLINE) && (
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={EPaymentPreference.ONLINE} id="online-change" />
                    <Label htmlFor="online-change" className="font-normal cursor-pointer">
                      {buildSentence(t, "online")}
                    </Label>
                  </div>
                )}
              </RadioGroup>
              {paymentPreference === EPaymentPreference.CASH && (
                <p className="text-sm text-muted-foreground">
                  {buildSentence(t, "billing", "will", "be", "created")}. {t("pay")} {t("later")} {t("at")} {t("the")} {t("facility")}.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </AppDialog>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh]">
          {step === "select" && renderSelectStep()}
          {step === "summary" && renderSummaryStep()}
        </DialogContent>
      </Dialog>

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        stripeCards={stripeCards}
        onPay={handlePayClick}
        isLoading={isProcessingPayment}
        amount={totalAmount}
        showSaveOptions={true}
      />
    </>
  );
}
