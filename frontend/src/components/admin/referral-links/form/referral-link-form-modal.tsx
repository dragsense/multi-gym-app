// External Libraries
import React, { type ReactNode, useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TReferralLinkData } from "@shared/types/referral-link.type";
import type { IReferralLinkResponse } from "@shared/interfaces/referral-link.interface";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

export interface IReferralLinkFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IReferralLinkFormModalProps extends THandlerComponentProps<TFormHandlerStore<TReferralLinkData, IReferralLinkResponse, IReferralLinkFormModalExtraProps>> {
}

const ReferralLinkFormModal = React.memo(function ReferralLinkFormModal({
  storeKey,
  store,
}: IReferralLinkFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, 'form', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const isEditing = store((state) => state.isEditing)

  const open = store((state) => state.extra.open)
  const onClose = store((state) => state.extra.onClose)

  // React 19: Memoized fields for better performance
  const storeFields = store((state) => state.fields);

  // React 19: Memoized fields for better performance and translated labels
  const fields = useMemo(() => ({
    ...storeFields,
    title: {
      ...storeFields.title,
      label: buildSentence(t, "title"),
      placeholder: buildSentence(t, "enterTitle"),
    },
    type: {
      ...storeFields.type,
      label: buildSentence(t, "type"),
    },
    description: {
      ...storeFields.description,
      label: buildSentence(t, "description"),
      placeholder: buildSentence(t, "enterDescription"),
    },
    commissionPercentage: {
      ...storeFields.commissionPercentage,
      label: buildSentence(t, "commissionPercentage"),
      placeholder: buildSentence(t, "enterCommissionPercentage"),
    },
    expiresAt: {
      ...storeFields.expiresAt,
      label: buildSentence(t, "expiresAt"),
      placeholder: buildSentence(t, "enterExpiresAt"),
    },
    maxUses: {
      ...storeFields.maxUses,
      label: buildSentence(t, "maxUses"),
      placeholder: buildSentence(t, "enterMaxUses"),
    },
  } as TFieldConfigObject<TReferralLinkData>), [storeFields, t]);

  const inputs = useInput<TReferralLinkData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TReferralLinkData>;

  // React 19: Smooth modal state changes
  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  };

  // React 19: Memoized form buttons for better performance
  const formButtons = useMemo(() => (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          startTransition(() => {
            onClose();
          });
        }}
        data-component-id={componentId}
      >
        {buildSentence(t, 'cancel')}
      </Button>
      <Button type="submit" disabled={false} data-component-id={componentId}>
        {false && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? buildSentence(t, 'update') : buildSentence(t, 'add')}
      </Button>
    </div>
  ), [componentId, isEditing, onClose, t, startTransition]);

  return <>
    <ModalForm<TReferralLinkData, IReferralLinkResponse, IReferralLinkFormModalExtraProps>
      title={buildSentence(t, isEditing ? 'edit' : 'add', 'referral', 'link')}
      description={buildSentence(t, isEditing ? 'update' : 'add', 'referral', 'link')}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      data-component-id={componentId}
      footerContent={formButtons}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inputs.title}
        {inputs.type}
        <div className="col-span-2">
          {inputs.description}
        </div>
        {inputs.commissionPercentage}
        {inputs.expiresAt}
        {inputs.maxUses}
      </div>
    </ModalForm>
  </>;
});

export default ReferralLinkFormModal;
