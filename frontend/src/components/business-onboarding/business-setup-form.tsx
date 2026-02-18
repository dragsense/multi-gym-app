// React
import React, { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { useWatch } from "react-hook-form";
import type { TFormHandlerStore } from "@/stores";
import type { CreateBusinessDto } from "@shared/dtos";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type {
  TFieldConfigObject,
  TCustomInputWrapper,
} from "@/@types/form/field-config.type";
import { useInput, type FormInputs } from "@/hooks/use-input";
import { usePaymentProcessors } from "@/hooks/use-payment-processors";
import { config } from "@/config";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Form } from "@/components/form-ui/form";
import { StepNavigationButtons } from "@/components/business-onboarding";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet } from "lucide-react";
import { EPaymentProcessorType } from "@shared/enums";

type IBusinessSetupExtraProps = {
  onBack?: () => void;
};

interface IBusinessSetupFormProps {
  storeKey: string;
  store: TFormHandlerStore<CreateBusinessDto, any, IBusinessSetupExtraProps>;
}

// Custom component – payment processor radio (same pattern as billing recipient)
const PaymentProcessorRadio = React.memo((props: TCustomInputWrapper) => {
  const { processors, isLoading } = usePaymentProcessors();
  const value = props.value ?? "";

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading payment processors...</p>;
  }
  if (!processors.length) {
    return <p className="text-sm text-muted-foreground">No payment processors available.</p>;
  }

  const icons: Partial<Record<EPaymentProcessorType, React.ReactNode>> = {
    [EPaymentProcessorType.STRIPE]: <CreditCard className="h-5 w-5" />,
    [EPaymentProcessorType.PAYSAFE]: <Wallet className="h-5 w-5" />,
  };

  return (
    <RadioGroup
      value={value}
      onValueChange={(id) => props.onChange(id || null)}
      disabled={props.disabled}
      className="grid gap-3"
    >
      {processors.map((processor) => (
        <Label
          key={processor.id}
          htmlFor={processor.id}
          className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-muted/50"
        >
          <RadioGroupItem value={processor.id} id={processor.id} />
          <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
            {icons[processor.type as EPaymentProcessorType] ?? <CreditCard className="h-5 w-5" />}
          </span>
          <div className="flex-1">
            <p className="font-medium capitalize">{processor.type}</p>
            {processor.description && (
              <p className="text-sm text-muted-foreground">{processor.description}</p>
            )}
          </div>
        </Label>
      ))}
    </RadioGroup>
  );
});

const SubdomainPreview = () => {
  const subdomain = useWatch<CreateBusinessDto>({ name: "subdomain" }) || "";
  const mainDomain = config.mainDomain;
  if (!subdomain) {
    return <span className="text-muted-foreground">{mainDomain}</span>;
  }
  return (
    <span className="text-foreground">
      {subdomain}.{mainDomain}
    </span>
  );
};

export function BusinessSetupForm({ store, storeKey }: IBusinessSetupFormProps) {
  if (!store) return null;

  const isSubmitting = store(useShallow((state) => state.isSubmitting));
  const storeFields = store(useShallow((state) => state.fields));

  const fields = useMemo(
    () =>
      ({
        ...storeFields,
        subdomain: {
          ...storeFields.subdomain,
          endAdornment: <SubdomainPreview />,
        },
      /*   paymentProcessorId: {
          ...storeFields.paymentProcessorId,
          type: "custom" as const,
          label: "Payment processor",
          Component: PaymentProcessorRadio,
        }, */
      }) as TFieldConfigObject<CreateBusinessDto>,
    [storeFields]
  );

  const { onBack } = store(useShallow((state) => state.extra));

  const inputs = useInput<CreateBusinessDto>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<CreateBusinessDto>;

  return (
    <Form<CreateBusinessDto, IMessageResponse> formStore={store}>
      <div className="space-y-6">
        <AppCard
          footer={
            <StepNavigationButtons
              onBack={onBack}
              continueLabel="Continue"
              continueDisabled={isSubmitting}
              continueLoading={isSubmitting}
              showBack={!!onBack}
              continueType="submit"
            />
          }
        >
          <div className="text-sm text-muted-foreground">
            Set up your business information to get started
          </div>
          <div className="space-y-4">
            {inputs.name}
            <div>
              {inputs.subdomain}
              <p className="text-xs text-muted-foreground mt-1">
                This will be your unique subdomain for accessing your business portal
              </p>
            </div>
            {/* <div>
              <p className="text-xs text-muted-foreground mb-2">
                Your business will use the selected payment processor for all payments. You can
                change this later in business settings.
              </p>
              {inputs.paymentProcessorId}
            </div> */}
          </div>
        </AppCard>
      </div>
    </Form>
  );
}
