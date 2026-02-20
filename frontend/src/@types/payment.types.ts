/** Raw payment method card from API (Stripe/Paysafe adapter) */
export interface IStripeCard {
  id: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding?: string;
  };
  billing_details?: {
    name?: string | null;
    email?: string | null;
  };
  created: number;
}

/** Card display shape for payment modals (mapped from API) */
export interface PaymentCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  isDefault?: boolean;
}

/** Form data when paying with new card (save options) */
export interface PaymentCardFormData {
  saveForFutureUse?: boolean;
  saveAsDefault?: boolean;
}

/** @deprecated Use PaymentCard */
export type StripePaymentCard = PaymentCard;
/** @deprecated Use PaymentCardFormData */
export type StripeCardFormData = PaymentCardFormData;