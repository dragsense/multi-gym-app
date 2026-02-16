// Stripe payment method card type
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

/** Card display shape used by StripePaymentModal (mapped from IStripeCard) */
export interface StripePaymentCard {
  id: string;
  last4: string;
  brand: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  isDefault?: boolean;
}

/** Form data from StripePaymentModal when paying with new card */
export interface StripeCardFormData {
  saveForFutureUse?: boolean;
  saveAsDefault?: boolean;
}