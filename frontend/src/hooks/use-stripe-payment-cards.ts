import { useQuery } from "@tanstack/react-query";
import { fetchStripePaymentCards } from "@/services/stripe.api";
import type { IStripeCard, StripePaymentCard } from "@/@types/payment.types";
// Toast will be handled by the component using this hook

export function useStripePaymentCards() {
  const {
    data: stripePaymentCards,
    isLoading: isLoadingPaymentCards,
    error: errorPaymentCards,
  } = useQuery<{ paymentMethods: IStripeCard[]; defaultPaymentMethodId: string | null }>({
    queryKey: ["stripe-payment-cards"],
    queryFn: () => fetchStripePaymentCards(),
  });

  const stripeCards: StripePaymentCard[] =
    stripePaymentCards?.paymentMethods.map((pm: IStripeCard) => ({
      id: pm.id,
      last4: pm.card?.last4 || "0000",
      brand: pm.card?.brand || "card",
      expiryMonth: pm.card?.exp_month || 12,
      expiryYear: pm.card?.exp_year || new Date().getFullYear(),
      cardholderName: pm.billing_details?.name || "",
    })) || [];

  return {
    stripeCards,
    isLoadingPaymentCards,
    errorPaymentCards,
  };
}
