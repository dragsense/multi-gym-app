import { useId, useTransition, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";

// Types
import { type TUserSettingsData } from "@shared/types/settings.type";
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TSingleHandlerStore } from "@/stores";

// Handlers
import { FormHandler } from "@/handlers";

// Components
import { UserSettingsForm } from "@/components/admin";

// Services
import { createOrUpdateMySettings } from "@/services/settings.api";
import { CreateOrUpdateUserSettingsDto } from "@shared/dtos/settings-dtos";
import { strictDeepMerge } from "@/utils";
import type { IUserSettings } from "@shared/interfaces/settings.interface";

interface IUserSettingsFormHandlerProps
  extends THandlerComponentProps<TSingleHandlerStore<IUserSettings, any>> {
  // Props interface for user settings form handler
}

export default function UserSettingsFormHandler({
  storeKey,
  store,
}: IUserSettingsFormHandlerProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  if (!store) {
    return (
      <div>
        Single store "{storeKey}" not found. Did you forget to register it?
      </div>
    );
  }

  const { response, isLoading } = store(
    useShallow((state) => ({
      response: state.response,
      isLoading: state.isLoading,
    }))
  );

  const INITIAL_VALUES: TUserSettingsData = {
    time: {
      timezone: undefined,
      timeFormat: undefined,
      dateFormat: undefined,
    },
    currency: {
      defaultCurrency: undefined,
      currencySymbol: undefined,
    },
    limits: {
      maxSessionsPerDay: undefined,
      maxMembersPerSession: undefined,
      maxMembersPerTrainer: undefined,
      maxSessionDuration: undefined,
      slotStepMinutes: undefined,
    },
    business: {
      businessName: undefined,
      businessEmail: undefined,
      businessPhone: undefined,
      businessAddress: undefined,
      businessLogo: undefined,
    },
    billing: {
      taxRate: undefined,
      invoicePrefix: undefined,
    },
    notifications: {
      emailEnabled: undefined,
      smsEnabled: undefined,
      pushEnabled: undefined,
      inAppEnabled: undefined,
    },
    theme: {
      theme: undefined,
    },
  };
  // React 19: Memoized initial values with deferred processing
  const initialValues = strictDeepMerge<TUserSettingsData>(
    INITIAL_VALUES,
    response ?? {}
  );

  const handleSuccess = useCallback(() => {
    startTransition(() => {
      toast.success("Settings updated successfully");
    });
  }, [startTransition]);

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div data-component-id={componentId}>
      <FormHandler<TUserSettingsData, TUserSettingsData>
        mutationFn={createOrUpdateMySettings}
        FormComponent={UserSettingsForm}
        isEditing={true}
        initialValues={initialValues}
        validationMode={EVALIDATION_MODES.OnSubmit}
        dto={CreateOrUpdateUserSettingsDto}
        onSuccess={handleSuccess}
        onError={(error) =>
          toast.error("Failed to update settings: " + error?.message)
        }
        storeKey={storeKey}
      />
    </div>
  );
}
