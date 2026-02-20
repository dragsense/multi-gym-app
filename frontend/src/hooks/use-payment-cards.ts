import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPaymentCards,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  addPaymentMethod,
  fetchUserDefaultPaymentMethod,
} from "@/services/payment-adapter.api";
import { toast } from "sonner";
import type { PaymentCard } from "@/@types/payment.types";
import type { IPaymentCard, IPaymentCardsResponse } from "@shared/interfaces";

export const PAYMENT_CARDS_KEY = "payment-cards";
export const DEFAULT_PAYMENT_METHOD_KEY = "default-payment-method";

/** Saved cards for payment modal (payment-adapter API: Stripe or Paysafe by tenant). */
export function usePaymentCards() {
  const {
    data,
    isLoading: isLoadingPaymentCards,
    error: errorPaymentCards,
  } = useQuery<IPaymentCardsResponse, Error>({
    queryKey: [PAYMENT_CARDS_KEY],
    queryFn: fetchPaymentCards,
    retry: false,
  });

  const cards: PaymentCard[] = (data?.paymentMethods ?? []).map((pm) => ({
    id: pm.id,
    last4: pm.card?.last4 ?? "0000",
    brand: pm.card?.brand ?? "card",
    expiryMonth: pm.card?.exp_month ?? 12,
    expiryYear: pm.card?.exp_year ?? new Date().getFullYear(),
    cardholderName: pm.billing_details?.name ?? "",
    isDefault: data?.defaultPaymentMethodId === pm.id,
  }));

  return { cards, isLoadingPaymentCards, errorPaymentCards };
}

/**
 * Hook for fetching just the default card - use in detail pages (member, staff, business, account)
 */
export const useDefaultCard = (userId: string) => {
  const {
    data: defaultPaymentMethod,
    isLoading: isLoadingDefaultPaymentMethod,
  } = useQuery<IPaymentCard | null, Error>({
    queryKey: [DEFAULT_PAYMENT_METHOD_KEY, userId],
    queryFn: () => fetchUserDefaultPaymentMethod(userId),
    retry: false,
  });

  return {
    defaultPaymentMethod,
    isLoading: isLoadingDefaultPaymentMethod,
  };
};

/**
 * Hook for full payment cards management - use in account settings Payment Cards tab.
 * Uses unified payment-adapter API (Stripe or Paysafe by tenant).
 */
export const usePaymentCardsManager = () => {
  const queryClient = useQueryClient();

  const {
    data: { paymentMethods, defaultPaymentMethodId } = {
      paymentMethods: [],
      defaultPaymentMethodId: null,
    },
    isLoading: isLoadingCards,
    error: cardsError,
    refetch: refetchCards,
  } = useQuery<IPaymentCardsResponse, Error>({
    queryKey: [PAYMENT_CARDS_KEY],
    queryFn: fetchPaymentCards,
    retry: false,
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      toast.success("Default payment method updated");
      queryClient.invalidateQueries({ queryKey: [DEFAULT_PAYMENT_METHOD_KEY] });
      queryClient.invalidateQueries({ queryKey: [PAYMENT_CARDS_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to set default payment method");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      toast.success("Payment method deleted");
      queryClient.invalidateQueries({ queryKey: [PAYMENT_CARDS_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete payment method");
    },
  });

  const addCardMutation = useMutation({
    mutationFn: ({
      paymentMethodId,
      setAsDefault,
    }: {
      paymentMethodId: string;
      setAsDefault?: boolean;
    }) => addPaymentMethod(paymentMethodId, setAsDefault ?? false),
    onSuccess: () => {
      toast.success("Payment method added successfully");
      queryClient.invalidateQueries({ queryKey: [PAYMENT_CARDS_KEY] });
      queryClient.invalidateQueries({ queryKey: [DEFAULT_PAYMENT_METHOD_KEY] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add payment method");
    },
  });

  return {
    cards: paymentMethods,
    defaultPaymentMethodId,
    isLoading: isLoadingCards,
    error: cardsError,
    refetchCards,
    setDefaultCard: setDefaultMutation.mutate,
    isSettingDefault: setDefaultMutation.isPending,
    deleteCard: deleteMutation.mutate,
    isDeletingCard: deleteMutation.isPending,
    addCard: addCardMutation.mutate,
    isAddingCard: addCardMutation.isPending,
  };
};
