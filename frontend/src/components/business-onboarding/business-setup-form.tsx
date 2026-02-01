// React
import { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { useFormContext, useWatch } from "react-hook-form";
import type { TFormHandlerStore } from "@/stores";
import type { CreateBusinessDto } from "@shared/dtos";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import { useInput, type FormInputs } from "@/hooks/use-input";
import { config } from "@/config";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Form } from "@/components/form-ui/form";
import { StepNavigationButtons } from "@/components/business-onboarding";

type IBusinessSetupExtraProps = {
  onBack?: () => void;
}

interface IBusinessSetupFormProps {
  storeKey: string;
  store: TFormHandlerStore<CreateBusinessDto, any, IBusinessSetupExtraProps>;
}

// Subdomain preview component that will be rendered inside Form context
const SubdomainPreview = () => {
  const subdomain = useWatch<CreateBusinessDto>({ name: "subdomain" }) || "";
  const mainDomain = config.mainDomain;
  
  if (!subdomain) {
    return <span className="text-muted-foreground">{mainDomain}</span>;
  }
  
  return <span className="text-foreground">{subdomain}.{mainDomain}</span>;
};

export function BusinessSetupForm({ store, storeKey }: IBusinessSetupFormProps) {
  if (!store) return null;

  const isSubmitting = store(useShallow(state => state.isSubmitting));
  const storeFields = store(useShallow(state => state.fields));

  const fields = useMemo(() => ({
    ...storeFields,
    subdomain: {
      ...storeFields.subdomain,
      endAdornment: <SubdomainPreview />,
    },
  } as TFieldConfigObject<CreateBusinessDto>), [storeFields]);

  const { onBack } = store(useShallow(state => state.extra));

  const inputs = useInput<CreateBusinessDto>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<CreateBusinessDto>;

  return (
    <Form<CreateBusinessDto, IMessageResponse> formStore={store}>
      <div className="space-y-6">
        <AppCard footer={
          <StepNavigationButtons
            onBack={onBack}
            continueLabel="Continue"
            continueDisabled={isSubmitting}
            continueLoading={isSubmitting}
            showBack={!!onBack}
            continueType="submit"
          />
        }>
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
          </div>
        </AppCard>
      </div>
    </Form>
  );
}
