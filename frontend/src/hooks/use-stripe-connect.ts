import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getConnectedAccountId } from "@/services/stripe-connect.api";
import { getStripeForConnect } from "@/lib/stripe";

/**
 * Hook that fetches the connected Stripe account for the current tenant
 * and returns the appropriate Stripe instance.
 *
 * - If a connected account exists → loads Stripe with `stripeAccount`
 * - If no connected account → returns `{ stripeAccountId: null, error }` so the UI can show a message
 * - While loading → returns `{ isLoading: true }`
 */
export function useStripeConnect() {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["stripe-connected-account-id"],
    queryFn: () => getConnectedAccountId(),
    staleTime: 0,
    retry: 1,
  });

  const stripeAccountId = data?.stripeAccountId ?? null;

  const stripePromise = useMemo(() => {
    if (isLoading) return null;
    return getStripeForConnect(stripeAccountId);
  }, [stripeAccountId, isLoading]);

  return {
    stripePromise,
    stripeAccountId,
    isLoading,
    error,
  };
}
