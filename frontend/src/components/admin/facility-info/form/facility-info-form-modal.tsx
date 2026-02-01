// External Libraries
import React, { useId, useMemo, useTransition } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TCreateFacilityInfoData, TUpdateFacilityInfoData } from "@shared/types/facility-info.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { FormErrors } from "@/components/shared-ui/form-errors";

export interface IFacilityInfoFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IFacilityInfoFormModalProps extends THandlerComponentProps<TFormHandlerStore<TCreateFacilityInfoData | TUpdateFacilityInfoData, IMessageResponse, IFacilityInfoFormModalExtraProps>> { }

const FacilityInfoFormModal = React.memo(function FacilityInfoFormModal({
  storeKey,
  store,
}: IFacilityInfoFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);
  const fields = store((state) => state.fields);
  const isSubmitting = store((state) => state.isSubmitting);
  const isEditing = store((state) => state.isEditing);

  const memoizedFields = useMemo(() => {
    return fields as TFieldConfigObject<TCreateFacilityInfoData>;
  }, [fields]);

  const inputs = useInput<TCreateFacilityInfoData>({
    fields: memoizedFields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateFacilityInfoData>;

  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => onClose());
    }
  };

  const formButtons = useMemo(() => (
    <div className="flex justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          startTransition(() => onClose());
        }}
      >
        {t('cancel')}
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? t('updateFacilityInfo') : t('createFacilityInfo')}
      </Button>
    </div>
  ), [onClose, isSubmitting, isEditing, t, startTransition]);

  return (
    <ModalForm<TCreateFacilityInfoData | TUpdateFacilityInfoData, IMessageResponse, IFacilityInfoFormModalExtraProps>
      title={isEditing ? t('updateFacilityInfo') : t('createFacilityInfo')}
      description={isEditing ? t('updateFacilityInfoInformation') : t('createNewFacilityInfo')}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="2xl"
      data-component-id={componentId}
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold mb-3">{t('facilityInfoDetails')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {inputs.email}
            {inputs.phone}
            {inputs.address}
            {inputs.status}
          </div>
        </div>
      </div>
      <FormErrors />
    </ModalForm>
  );
});

export default FacilityInfoFormModal;

