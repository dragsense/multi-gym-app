// External Libraries
import React, { type ReactNode, useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";
// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";

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

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const isEditing = store((state) => state.isEditing)

  const open = store((state) => state.extra.open)
  const onClose = store((state) => state.extra.onClose)

  // React 19: Memoized fields for better performance
  const storeFields = store((state) => state.fields)


  // React 19: Memoized fields for better performance
  const fields = useMemo(() => ({
    ...storeFields,
  } as TFieldConfigObject<TReferralLinkData>), [storeFields]);

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
        Cancel
      </Button>
      <Button type="submit" disabled={false} data-component-id={componentId}>
        {false && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? "Update" : "Add"}
      </Button>
    </div>
  ), [componentId, isEditing, onClose]);

  return <>
    <ModalForm<TReferralLinkData, IReferralLinkResponse, IReferralLinkFormModalExtraProps>
      title={`${isEditing ? "Edit" : "Add"} Referral Link`}
      description={`${isEditing ? "Update" : "Create"} a new referral link`}
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
