import { useMemo } from "react";
import { usePaymentProcessors } from "@/hooks/use-payment-processors";
import { EPaymentProcessorType } from "@shared/enums";
import type { PaymentProcessorType } from "./types";

export interface UsePaymentProcessorOptions {
  /** Current business payment processor id (e.g. from businessData.paymentProcessorId). */
  paymentProcessorId?: string | null;
}

/**
 * Gets payment processor list from backend and resolves the processor type for the given context.
 * Use this to decide which payment modal (Stripe vs Paysafe) to show.
 */
export function usePaymentProcessor(options: UsePaymentProcessorOptions = {}) {
  const { paymentProcessorId } = options;
  const { processors, isLoading } = usePaymentProcessors();

  const processorType = useMemo((): PaymentProcessorType | null => {
    if (!paymentProcessorId) return null;
    const p = processors.find((x) => x.id === paymentProcessorId);
    if (!p) return null;
    if (p.type === EPaymentProcessorType.STRIPE) return EPaymentProcessorType.STRIPE as PaymentProcessorType;
    if (p.type === EPaymentProcessorType.PAYSAFE) return EPaymentProcessorType.PAYSAFE as PaymentProcessorType;
    return null;
  }, [processors, paymentProcessorId]);

  return {
    processorType,
    isLoading,
    processors,
  };
}
