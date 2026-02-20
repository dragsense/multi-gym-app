import { useQuery } from "@tanstack/react-query";
import { getMyBusinessPaymentProcessorType } from "@/services/business/business.api";
import { EPaymentProcessorType } from "@shared/enums";
import type { PaymentProcessorType } from "@/@types/payment-processor.types";
/**
 * Returns the current business payment processor type from backend.
 * Backend skips business check when user level is MEMBER (returns null).
 */
export function useCurrentBusinessPaymentProcessor() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-business-payment-processor-type"],
    queryFn: getMyBusinessPaymentProcessorType,
  });

  const processorType: PaymentProcessorType | null =
    data?.type === EPaymentProcessorType.STRIPE
      ? EPaymentProcessorType.STRIPE
      : data?.type === EPaymentProcessorType.PAYSAFE
        ? EPaymentProcessorType.PAYSAFE
        : null;

  return {
    processorType,
    isLoading,
    paymentProcessorId: data?.paymentProcessorId ?? null,
    processors: [],
  };
}
