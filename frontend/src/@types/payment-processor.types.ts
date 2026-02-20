import type { EPaymentProcessorType } from "@shared/enums";
import type { PaymentCard } from "@/@types/payment.types";
import type { PaymentCardFormData } from "@/@types/payment.types";

/** Processor type used for payment UI (Stripe vs Paysafe). */
export type PaymentProcessorType = EPaymentProcessorType.STRIPE | EPaymentProcessorType.PAYSAFE;

/** Common props for any payment modal (adapter interface). */
export interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with payment method id (Stripe) or single-use token (Paysafe). */
  onPay: (paymentMethodOrToken: string, cardData?: PaymentCardFormData) => void | Promise<void>;
  isLoading?: boolean;
  amount?: number;
  error?: string;
  /** Saved cards when processor supports them. */
  cards?: PaymentCard[];
  /** Show save for future use / set as default (Stripe). */
  showSaveOptions?: boolean;
}

/** Result of usePaymentProcessor: which processor to use and optional modal component. */
export interface PaymentProcessorContextValue {
  processorType: PaymentProcessorType | null;
  isLoading: boolean;
  processors: Array<{ id: string; type: string }>;
}
