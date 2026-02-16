import { config } from "@/config";
import { loadStripe } from "@stripe/stripe-js";

// Infer the Stripe type from loadStripe return type
type StripeInstance = Awaited<ReturnType<typeof loadStripe>>;

const publishableKey = config.stripePublishableKey;

// Cache: platform instance + per-connected-account instances
let stripePromise: Promise<StripeInstance> | null = null;


/**
 * Get Stripe instance for a connected account.
 * Pass the connected account's stripeAccountId so Elements/tokenization
 * targets the connected account (required for destination charges where
 * customers/PMs live on the connected account).
 */
export const getStripeForConnect = (
  stripeAccountId: string
): Promise<StripeInstance> => {
  if (!publishableKey) {
    console.warn(
      "Stripe publishable key is not set. Please set VITE_STRIPE_PUBLISHABLE_KEY in your .env file."
    );
    return Promise.resolve(null as StripeInstance);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey, { ...(stripeAccountId ? { stripeAccount: stripeAccountId } : {}) });
  }
  return stripePromise;
};
