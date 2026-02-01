// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useId, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TSubscriptionData } from "@shared/types";
import {
  type IMessageResponse,
  type ISubscription,
  type ISubscriptionResponse,
} from "@shared/interfaces";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import {
  SubscriptionFormModal,
  type ISubscriptionFormModalExtraProps,
} from "@/components/admin/subscriptions/form/subscription-form-modal";

// Services
import {
  createSubscription,
  updateSubscription,
} from "@/services/subscription.api";
import { strictDeepMerge } from "@/utils";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { CreateSubscriptionDto, UpdateSubscriptionDto } from "@shared/dtos";
import {
  ESubscriptionStatus,
  ESubscriptionFrequency,
  ESubscriptionType,
} from "@shared/enums";
import { toast } from "sonner";

export type TSubscriptionExtraProps = {
  level?: number;
};

interface ISubscriptionFormProps
  extends THandlerComponentProps<
    TSingleHandlerStore<ISubscription, TSubscriptionExtraProps>
  > { }

export function SubscriptionForm({ storeKey, store }: ISubscriptionFormProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  const { action, response, isLoading, setAction, reset } = store(
    useShallow((state) => ({
      action: state.action,
      response: state.response,
      isLoading: state.isLoading,
      setAction: state.setAction,
      reset: state.reset,
    }))
  );

  const INITIAL_VALUES: TSubscriptionData = {
    title: "",
    description: "",
    status: ESubscriptionStatus.ACTIVE, // required enum
    sortOrder: 0, // optional
    color: "#3366ff", // optional default color
    price: 0, // required
    discountPercentage: 0, // optional
    frequency: [ESubscriptionFrequency.MONTHLY], // required enum
    features: [], // required non-empty array (can start empty)
    autoRenewal: false, // optional boolean
    trialPeriod: 0, // optional
  };

  const initialValues = useMemo(
    () => strictDeepMerge<TSubscriptionData>(INITIAL_VALUES, response ?? {}),
    [INITIAL_VALUES, response?.id]
  );

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(
    () => (isEditing ? updateSubscription(response.id) : createSubscription),
    [isEditing, response?.id]
  );
  const dto = useMemo(
    () => (isEditing ? UpdateSubscriptionDto : CreateSubscriptionDto),
    [isEditing]
  );

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div data-component-id={componentId}>
      <FormHandler<
        TSubscriptionData,
        ISubscriptionResponse,
        ISubscriptionFormModalExtraProps
      >
        mutationFn={mutationFn}
        FormComponent={SubscriptionFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={(response: IMessageResponse) => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
          });
          toast.success(response.message || (isEditing ? "Subscription updated successfully!" : "Subscription created successfully!"));
          handleClose();
        }}
        formProps={{
          open: action === "createOrUpdate",
          onClose: handleClose,
        }}
      />
    </div>
  );
}
