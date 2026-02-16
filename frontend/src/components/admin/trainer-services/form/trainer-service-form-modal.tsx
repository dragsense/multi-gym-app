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
import type { TCreateTrainerServiceData, TUpdateTrainerServiceData } from "@shared/types/trainer-service.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { FormErrors } from "@/components/shared-ui/form-errors";

export interface ITrainerServiceFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface ITrainerServiceFormModalProps extends THandlerComponentProps<TFormHandlerStore<TCreateTrainerServiceData | TUpdateTrainerServiceData, IMessageResponse, ITrainerServiceFormModalExtraProps>> { }

const TrainerServiceFormModal = React.memo(function TrainerServiceFormModal({
  storeKey,
  store,
}: ITrainerServiceFormModalProps) {
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

  const inputs = useInput<TCreateTrainerServiceData>({
    fields: fields as TFieldConfigObject<TCreateTrainerServiceData>,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateTrainerServiceData>;

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
        {isEditing ? t('updateTrainerService') : t('createTrainerService')}
      </Button>
    </div>
  ), [onClose, isSubmitting, isEditing, t, startTransition]);

  return (
    <ModalForm<TCreateTrainerServiceData | TUpdateTrainerServiceData, IMessageResponse, ITrainerServiceFormModalExtraProps>
      title={isEditing ? t('updateTrainerService') : t('createTrainerService')}
      description={isEditing ? t('updateTrainerServiceInformation') : t('createNewTrainerService')}
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
          <h3 className="text-sm font-semibold mb-3">{t('trainerServiceDetails')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {inputs.title}
            {inputs.description}
            {inputs.status}
          </div>
        </div>
      </div>
      <FormErrors />
    </ModalForm>
  );
});

export default TrainerServiceFormModal;

