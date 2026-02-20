// React
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Types
import type { IMembership } from "@shared/interfaces";
import type { PaymentCardFormData } from "@/@types/payment.types";
import { EPaymentPreference } from "@shared/enums/membership.enum";
import type { CreateMemberMembershipPaymentIntentDto } from "@shared/dtos";

// Components
import { SelectMembershipModal } from "@/components/shared-ui/select-membership-modal";

// Services
import { createMemberMembershipBillingPaymentIntent } from "@/services/membership/membership-payment.api";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useActiveMemberships } from "@/hooks/use-active-memberships";
import { usePaymentCards } from "@/hooks/use-payment-cards";
import { buildSentence } from "@/locales/translations";
import { toast } from "sonner";

interface ISelectMembershipHandlerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Page Component that handles data fetching and API calls for selecting membership
 * Passes data to the UI component
 */
export function SelectMembershipHandler({
  open,
  onOpenChange,
  onSuccess,
}: ISelectMembershipHandlerProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // Data fetching hooks
  const { data: membershipsData, isLoading: isLoadingMemberships } = useActiveMemberships();
  const { cards, isLoadingPaymentCards } = usePaymentCards();

  const memberships = membershipsData?.data || [];

  // Payment mutation
  const { mutate: processPayment, isPending: isProcessingPayment } = useMutation({
    mutationFn: (data: CreateMemberMembershipPaymentIntentDto) =>
      createMemberMembershipBillingPaymentIntent(data),
    onSuccess: () => {
      toast.success(buildSentence(t, "membership", "selected", "successfully"));
      // Invalidate membership queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["my-membership-summary"] });
      queryClient.invalidateQueries({ queryKey: ["member-memberships"] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error?.message || buildSentence(t, "payment", "failed"));
    },
  });

  // Handle payment callback
  const handlePayment = useCallback(
    (
      membership: IMembership,
      paymentPreference: EPaymentPreference,
      paymentMethodId?: string,
      cardData?: PaymentCardFormData
    ) => {
      const paymentData: CreateMemberMembershipPaymentIntentDto = {
        membershipId: membership.id,
        paymentPreference,
        paymentMethodId: paymentMethodId || undefined,
        saveForFutureUse: cardData?.saveForFutureUse || false,
        setAsDefault: cardData?.saveAsDefault || false,
      };

      processPayment(paymentData);
    },
    [processPayment]
  );

  return (
    <SelectMembershipModal
      open={open}
      onOpenChange={onOpenChange}
      memberships={memberships}
      isLoadingMemberships={isLoadingMemberships}
      cards={cards}
      isLoadingPaymentCards={isLoadingPaymentCards}
      isProcessingPayment={isProcessingPayment}
      onPayment={handlePayment}
    />
  );
}
