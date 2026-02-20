import { EPaymentProcessorType } from "@shared/enums";
import type { PaymentModalProps } from "@/@types/payment-processor.types";
import { useCurrentBusinessPaymentProcessor } from "@/hooks/use-current-business-payment-processor";
import { StripePaymentModal } from "./stripe";
import { PaysafePaymentModal } from "./paysafe";

export interface PaymentModalAdapterProps extends PaymentModalProps {
  /** Saved cards when processor supports them (from usePaymentCards). */
  cards?: PaymentModalProps["cards"];
}

/**
 * Renders the correct payment modal (Stripe or Paysafe) based on processor type from backend.
 * When processorType is omitted, uses current business payment processor (useCurrentBusinessPaymentProcessor).
 */
export function PaymentModalAdapter({
  cards = [],
  open,
  onOpenChange,
  onPay,
  isLoading,
  amount,
  error,
  showSaveOptions = true,
}: PaymentModalAdapterProps) {
  const { processorType } = useCurrentBusinessPaymentProcessor();

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
        cards={cards}
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
