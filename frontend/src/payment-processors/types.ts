import type { EPaymentProcessorType } from "@shared/enums";
import type { StripePaymentCard } from "@/@types/payment.types";
import type { StripeCardFormData } from "@/@types/payment.types";

/** Processor type used for payment UI (Stripe vs Paysafe). */
export type PaymentProcessorType = EPaymentProcessorType.STRIPE | EPaymentProcessorType.PAYSAFE;

/** Common props for any payment modal (adapter interface). */
export interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with payment method id (Stripe) or single-use token (Paysafe). */
  onPay: (paymentMethodOrToken: string, cardData?: StripeCardFormData) => void | Promise<void>;
  isLoading?: boolean;
  amount?: number;
  error?: string;
  /** Stripe only: list of saved cards. */
  stripeCards?: StripePaymentCard[];
  /** Stripe only: show save for future use / default. */
  showSaveOptions?: boolean;
}

/** Result of usePaymentProcessor: which processor to use and optional modal component. */
export interface PaymentProcessorContextValue {
  processorType: PaymentProcessorType | null;
  isLoading: boolean;
  processors: Array<{ id: string; type: string }>;
}
