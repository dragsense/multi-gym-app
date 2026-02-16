import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStripePaymentCards,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  addPaymentMethod,
  fetchUserDefaultPaymentMethod,
} from "@/services/stripe.api";
import { toast } from "sonner";
import type { IStripeCard } from "@/@types/payment.types";

export const PAYMENT_CARDS_KEY = "payment-cards";
export const DEFAULT_PAYMENT_METHOD_KEY = "default-payment-method";

/**
 * Hook for fetching just the default card - use in detail pages where you only need to display the default card
 */
export const useDefaultCard = (userId: string) => {
  // Fetch all payment cards
  const {
    data: defaultPaymentMethod,
    isLoading: isLoadingDefaultPaymentMethod,
  } = useQuery<IStripeCard, Error>({
    queryKey: [DEFAULT_PAYMENT_METHOD_KEY],
    queryFn: () => fetchUserDefaultPaymentMethod(userId),
    retry: false,
  });


  return {
    defaultPaymentMethod,
    isLoading: isLoadingDefaultPaymentMethod,
  };
};

/**
 * Hook for full payment cards management - use in account settings for managing all cards
 */
export const usePaymentCardsManager = () => {
  const queryClient = useQueryClient();

  // Fetch all payment cards
  const {
    data: { paymentMethods, defaultPaymentMethodId } = { paymentMethods: [], defaultPaymentMethodId: null },
    isLoading: isLoadingCards,
    error: cardsError,
    refetch: refetchCards,
  } = useQuery<{ paymentMethods: IStripeCard[], defaultPaymentMethodId: string | null }, Error>({
    queryKey: [PAYMENT_CARDS_KEY],
    queryFn: fetchStripePaymentCards,
    retry: false,
  });

  // Set default payment method mutation
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

  // Delete payment method mutation
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

  // Add payment method mutation
  const addCardMutation = useMutation({
    mutationFn: ({ paymentMethodId, setAsDefault }: { paymentMethodId: string; setAsDefault?: boolean }) =>
      addPaymentMethod(paymentMethodId, setAsDefault),
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
