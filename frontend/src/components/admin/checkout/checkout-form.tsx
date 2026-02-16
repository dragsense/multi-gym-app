import React from "react";
import { useShallow } from "zustand/shallow";
import { AppCard } from "@/components/layout-ui/app-card";
import { FormErrors } from "@/components/shared-ui/form-errors";
import { useI18n } from "@/hooks/use-i18n";
import type { ICheckout, ICheckoutResponse } from "@shared/interfaces";
import type { TFormHandlerStore } from "@/stores";
import { useInput, type FormInputs } from "@/hooks/use-input";
import { CheckoutSummary } from "./components/checkout-summary";
import { Form } from "@/components/form-ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";


export interface ICheckoutFormProps {
  storeKey: string;
  store: TFormHandlerStore<ICheckout, any, Record<string, unknown>>;
}


export function CheckoutForm({ storeKey, store }: ICheckoutFormProps) {
  const { t } = useI18n();

  const { error } = store(
    useShallow((s) => ({
      error: s.error,
    }))
  );

  const fields = store((state) => state.fields);
  const isSubmitting = store((state) => state.isSubmitting);  

  const memoizedFields = React.useMemo(() => {
    return {
      ...fields,
      shippingAddressLine1: {
        ...fields.shippingAddressLine1,
        label: t("addressLine1") || "Address Line 1",
        placeholder: "123 Main St",
      },
      shippingAddressLine2: {
        ...fields.shippingAddressLine2,
        label: t("addressLine2") || "Address Line 2 (Optional)",
        placeholder: "Apt 4B",
      },
      shippingCity: {
        ...fields.shippingCity,
        label: t("city") || "City",
        placeholder: "New York",
      },
      shippingState: {
        ...fields.shippingState,
        label: t("state") || "State",
        placeholder: "NY",
      },
      shippingZip: {
        ...fields.shippingZip,
        label: t("zipCode") || "Zip Code",
        placeholder: "10001",
      },
      shippingCountry: {
        ...fields.shippingCountry,
        label: t("country") || "Country",
        placeholder: "United States",
      },
      paymentPreference: {
        ...fields.paymentPreference,
        label: t("paymentPreference") || "Payment Method",
      },
    } as typeof fields;
  }, [fields, t]);

  const inputs = useInput<ICheckout>({
    fields:
      memoizedFields,
    showRequiredAsterisk: true,
  }) as FormInputs<ICheckout>;

  return (
    <Form<ICheckout, ICheckoutResponse>
      formStore={store}
    >

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 items-start">
        <div className="lg:col-span-2">
          <FormErrors />

          <AppCard
            header={
              <h2 className="font-semibold">
                {t("shippingDetails") || "Shipping Details"}
              </h2>
            }
          >
            <div className="grid gap-4">
              {inputs.shippingAddressLine1}
              {inputs.shippingAddressLine2}
              <div className="grid grid-cols-2 gap-4">
                {inputs.shippingCity}
                {inputs.shippingState}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {inputs.shippingZip}
                {inputs.shippingCountry}
              </div>
            </div>
          </AppCard>

          <AppCard
            header={
              <h3 className="font-medium">
                {t("paymentMethod") || "Payment Method"}
              </h3>
            }
          >
            {inputs.paymentPreference}
          </AppCard>
        </div>

        <div className="lg:col-span-1 sticky top-6">
          <CheckoutSummary />

          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("placeOrder") || "Place Order"}
            </Button>
        </div>
      </div>
    </Form>

  );
}
