
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