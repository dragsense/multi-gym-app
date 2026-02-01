// React
import { useMemo } from "react";
import { useShallow } from "zustand/shallow";
import type { TFormHandlerStore } from "@/stores";
import type { TUpdateProfileData } from "@shared/types/user.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import { useInput, type FormInputs } from "@/hooks/use-input";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Form } from "@/components/form-ui/form";
import { StepNavigationButtons } from "@/components/member-onboarding";


type IProfileExtraProps = {
  onBack?: () => void;
}


interface IProfileFormProps {
  storeKey: string;
  store: TFormHandlerStore<TUpdateProfileData, IMessageResponse, IProfileExtraProps>;
}

export function ProfileForm({ store, storeKey }: IProfileFormProps) {
  if (!store) return null;

  const isSubmitting = store(useShallow(state => state.isSubmitting));
  const storeFields = store(useShallow(state => state.fields));

  const fields = useMemo(() => ({
    ...storeFields,
  } as TFieldConfigObject<TUpdateProfileData>), [storeFields]);

  const { onBack } = store(useShallow(state => state.extra));

  const inputs = useInput<TUpdateProfileData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TUpdateProfileData>;

  return (
    <Form<TUpdateProfileData, IMessageResponse> formStore={store}>
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
            Please fill in your profile information to continue.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputs.phoneNumber}
            {inputs.address}
            {inputs.city}
            {inputs.state}
            {inputs.zipCode}
          </div>

        </AppCard>
      </div>
    </Form>
  );
}

