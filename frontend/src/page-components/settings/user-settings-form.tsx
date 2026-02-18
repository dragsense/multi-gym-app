import { useId, useTransition, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useShallow } from "zustand/shallow";
import { useQueryClient } from "@tanstack/react-query";

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
import { createOrUpdateMySettings, fetchMySettings } from "@/services/settings.api";
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
  const queryClient = useQueryClient();

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
    billing: {
      taxRate: undefined,
      invoicePrefix: undefined,
    },
    notifications: {
      emailEnabled: true, // Default: enabled
      smsEnabled: true, // Default: enabled
      pushEnabled: false, // Default: disabled
      inAppEnabled: true, // Default: enabled
    },
    theme: {
      theme: undefined,
    },
  };
  // React 19: Memoized initial values with deferred processing
  // Update initialValues whenever response changes to ensure form has latest saved values
  const initialValues = useMemo(() => {
    return strictDeepMerge<TUserSettingsData>(
      INITIAL_VALUES,
      response ?? {}
    );
  }, [response]);

  const handleSuccess = useCallback(async () => {
    startTransition(async () => {
      // Invalidate user settings query to refresh the settings
      await queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      
      // Refetch the settings to update the store's response
      // This ensures initialValues are updated immediately for the next form submission
      const updatedSettings = await queryClient.fetchQuery<IUserSettings>({
        queryKey: ["user-settings"],
        queryFn: fetchMySettings,
      });
      
      // Update the store's response with the freshly fetched settings
      if (store && updatedSettings) {
        store.getState().setResponse(updatedSettings);
      }
      
      toast.success("Settings updated successfully");
    });
  }, [startTransition, queryClient, store]);

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
