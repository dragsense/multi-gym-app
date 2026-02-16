import { EPaymentProcessorType } from "@shared/enums";
import type { PaymentModalProps, PaymentProcessorType } from "./types";
import { StripePaymentModal } from "./stripe";
import { PaysafePaymentModal } from "./paysafe";

export interface PaymentModalAdapterProps extends PaymentModalProps {
  /** Resolved from backend (usePaymentProcessor). Renders nothing if null. */
  processorType: PaymentProcessorType | null;
  /** Required for Stripe: list of saved cards. */
  stripeCards?: PaymentModalProps["stripeCards"];
}

/**
 * Renders the correct payment modal (Stripe or Paysafe) based on processor type from backend.
 * Use with usePaymentProcessor to get processorType from paymentProcessorId.
 */
export function PaymentModalAdapter({
  processorType,
  stripeCards = [],
  open,
  onOpenChange,
  onPay,
  isLoading,
  amount,
  error,
  showSaveOptions = true,
}: PaymentModalAdapterProps) {
  if (!processorType) return null;

  if (processorType === EPaymentProcessorType.PAYSAFE) {
    return (
      <PaysafePaymentModal
        open={open}
        onOpenChange={onOpenChange}
        onPay={onPay}
        isLoading={isLoading}
        amount={amount}
        error={error}
      />
    );
  }

  if (processorType === EPaymentProcessorType.STRIPE) {
    return (
      <StripePaymentModal
        open={open}
        onOpenChange={onOpenChange}
        stripeCards={stripeCards}
        onPay={onPay}
        isLoading={isLoading}
        amount={amount}
        error={error}
        showSaveOptions={showSaveOptions}
      />
    );
  }

  return null;
}
