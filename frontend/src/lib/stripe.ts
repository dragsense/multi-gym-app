import { config } from "@/config";
import { loadStripe } from "@stripe/stripe-js";

// Infer the Stripe type from loadStripe return type
type StripeInstance = Awaited<ReturnType<typeof loadStripe>>;

let stripePromise: Promise<StripeInstance> | null = null;

// Initialize Stripe at module load
const publishableKey = config.stripePublishableKey;

if (publishableKey) {
  stripePromise = loadStripe(publishableKey);
} else {
  console.warn(
    "Stripe publishable key is not set. Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env file."
  );
  stripePromise = Promise.resolve(null as StripeInstance);
}

export const getStripe = (): Promise<StripeInstance> => {
  return stripePromise!;
};
