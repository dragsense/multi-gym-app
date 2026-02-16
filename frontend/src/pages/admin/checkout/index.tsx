import { useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/shallow";
import { PageInnerLayout } from "@/layouts";
import { FormHandler } from "@/handlers";
import { CheckoutForm, CheckoutSummary } from "@/components/admin/checkout";
import { StripePaymentModal } from "@/components/shared-ui/stripe-payment-modal";
import { getCart } from "@/services/cart.api";
import { checkout } from "@/services/order.api";
import { SEGMENTS, ADMIN_ROUTES } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useI18n } from "@/hooks/use-i18n";
import { useStripePaymentCards } from "@/hooks/use-stripe-payment-cards";
import { EPaymentPreference } from "@shared/enums/membership.enum";
import type { StripeCardFormData } from "@/@types/payment.types";
import type { ICheckout } from "@shared/interfaces";
import { CheckoutDto as CheckoutDtoClass } from "@shared/dtos";
import { toast } from "sonner";

const CHECKOUT_STORE_KEY = "checkout";

const defaultCheckoutValues: ICheckout = {
  paymentPreference: EPaymentPreference.CASH,
  shippingAddressLine1: "",
  shippingAddressLine2: "",
  shippingCity: "",
  shippingState: "",
  shippingZip: "",
  shippingCountry: "",
};

export default function CheckoutPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const segment = SEGMENTS[user?.level ?? -1] ?? "/admin";

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<ICheckout | null>(null);

  const placeOrderMutation = useMutation({
    mutationFn: (payload: ICheckout) => checkout(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-list"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      setShowPaymentModal(false);
      setPendingFormData(null);
      navigate(`${segment}/${ADMIN_ROUTES.ORDERS}`);
      toast.success(t("orderProcessing"));
    },
    onError: (err: Error) => {
      toast.error(err?.message ?? t("orderProcessingFailed"));
    },
  });

  const mutationFn = useCallback(
    async (data: ICheckout) => {
      return data;
    },
    []
  );

  const onSuccess = useCallback(
    (response: any) => {

      if (response.paymentPreference === EPaymentPreference.ONLINE) {
        setPendingFormData(response);
        setShowPaymentModal(true);
        return;
      }
      placeOrderMutation.mutate(response);
    },
    [navigate, queryClient, segment, t]
  );

  const handlePaymentModalPay = useCallback(
    (paymentMethodId: string, cardData?: StripeCardFormData) => {
      if (!pendingFormData) {
        toast.error(t("formDataNotFound"));
        return;
      }
      const payload: ICheckout = {
        paymentPreference: EPaymentPreference.ONLINE,
        paymentMethodId,
        saveForFutureUse: cardData?.saveForFutureUse ?? false,
        setAsDefault: cardData?.saveAsDefault ?? false,
        shippingAddressLine1: pendingFormData.shippingAddressLine1,
        shippingCity: pendingFormData.shippingCity,
        shippingZip: pendingFormData.shippingZip,
        shippingCountry: pendingFormData.shippingCountry,
      };
      if (pendingFormData.shippingAddressLine2?.trim()) {
        payload.shippingAddressLine2 = pendingFormData.shippingAddressLine2;
      }
      if (pendingFormData.shippingState?.trim()) {
        payload.shippingState = pendingFormData.shippingState;
      }
      placeOrderMutation.mutate(payload);
    },
    [pendingFormData, placeOrderMutation, t]
  );

  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: getCart });
  const totalAmount = (cart?.items ?? []).reduce(
    (sum, i) => sum + (i.quantity ?? 0) * Number(i.unitPrice ?? 0),
    0
  );
  const { stripeCards } = useStripePaymentCards();

  return (
    <PageInnerLayout Header={null}>

      <FormHandler<ICheckout, any, any>
        storeKey={CHECKOUT_STORE_KEY}
        dto={CheckoutDtoClass}
        initialValues={defaultCheckoutValues}
        mutationFn={mutationFn}
        onSuccess={onSuccess}
        FormComponent={CheckoutForm}
        formProps={{}}
      />


      <StripePaymentModal
        open={showPaymentModal}
        onOpenChange={(open) => {
          setShowPaymentModal(open);
          if (!open) setPendingFormData(null);
        }}
        stripeCards={stripeCards}
        onPay={handlePaymentModalPay}
        isLoading={placeOrderMutation.isPending}
        amount={totalAmount}
        showSaveOptions={true}
      />
    </PageInnerLayout>
  );
}
