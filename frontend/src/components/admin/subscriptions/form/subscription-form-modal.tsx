// External Libraries
import React, { useMemo, useId, useTransition, type ReactNode } from "react";
import { ListOrdered, Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TSubscriptionData, TUpdateSubscriptionData } from "@shared/types";
import type { ISubscriptionResponse } from "@shared/interfaces";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { addRenderItem } from "@/lib/fields/dto-to-feilds";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip"

export interface ISubscriptionFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface ISubscriptionFormModalProps
  extends THandlerComponentProps<
    TFormHandlerStore<
      TSubscriptionData,
      ISubscriptionResponse,
      ISubscriptionFormModalExtraProps
    >
  > { }

export const SubscriptionFormModal = React.memo(function SubscriptionFormModal({
  storeKey,
  store,
}: ISubscriptionFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, "form", "store")} "${storeKey}" ${buildSentence(
      t,
      "not",
      "found"
    )}. ${buildSentence(t, "did", "you", "forget", "to", "register", "it")}?`;
  }

  const isEditing = store((state) => state.isEditing);
  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);
  const storeFields = store((state) => state.fields);

  // React 19: Memoized fields for better performance
  const fields = useMemo(() => ({
    ...storeFields,
    price: {
      ...storeFields.price,
      label: 'Price (per month)',
      min: 0,
    },
    discountPercentage: {
      ...storeFields.discountPercentage,
      label: 'Discount Percentage',
      min: 0,
      max: 100,
    },
    trialPeriod: {
      ...storeFields.trialPeriod,
      label: 'Trial Period (in days)',
      min: 0,
    },
    autoRenewal: {
      ...storeFields.autoRenewal,
      label: 'Auto Renewal',
    },
    sortOrder: {
      ...storeFields.sortOrder,
      label: 'Sort Order',
      min: 0,
      endAdornment: (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer">
                <ListOrdered className="h-4 w-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-sm">Determine the order in which subscription is displayed</p>
            </TooltipContent>
          </Tooltip>
        </button>

      ),
    },
    title: {
      ...storeFields.title,
      placeholder: 'Enter title',
    },
    description: {
      ...storeFields.description,
      placeholder: 'Enter description',
    },

  } as TFieldConfigObject<TSubscriptionData>), [storeFields]);

  const inputs = useInput<TSubscriptionData | TUpdateSubscriptionData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TSubscriptionData | TUpdateSubscriptionData>;

  const onOpenChange = (state: boolean) => {
    if (!state) {
      startTransition(() => onClose());
    }
  };

  // Memoized form buttons
  const formButtons = useMemo(
    () => (
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            startTransition(() => onClose());
          }}
          data-component-id={componentId}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={false} data-component-id={componentId}>
          {false && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? t("update") : t("add")}
        </Button>
      </div>
    ),
    [componentId, isEditing, onClose]
  );

  return (
    <ModalForm<
      TSubscriptionData,
      ISubscriptionResponse,
      ISubscriptionFormModalExtraProps
    >
      title={buildSentence(t, isEditing ? "Edit" : "Add", "Subscription")}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="3xl"
    >
      <div className="space-y-8">
        {/* Basic Subscription Information */}
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "Subscription", "Information")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.title}
            {inputs.status}
            {inputs.frequency}
            {inputs.price}
            {inputs.discountPercentage}
            {inputs.trialPeriod}
          </div>
          <div className="mt-6">{inputs.description}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
            {inputs.autoRenewal}

          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "Features")}
          </h3>
          <div className="grid grid-cols-1 gap-6 items-start">
            {inputs.features as ReactNode}
          </div>
        </div>

        {/* Optional Styling & Sorting */}
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "Visual", "and", "Sorting", "Options")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.color}
            {inputs.sortOrder}
          </div>
        </div>
      </div>
    </ModalForm>
  );
});
