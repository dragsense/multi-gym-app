import React, { useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableEquipmentTypes } from "@/hooks/use-searchable";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";

import type { TFormHandlerStore } from "@/stores";
import type { TEquipmentData } from "@shared/types/equipment-reservation.type";
import type { TEquipmentResponse } from "@shared/interfaces/equipment-reservation.interface";
import type { IEquipmentType } from "@shared/interfaces/equipment-reservation.interface";

import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject, TCustomInputWrapper } from "@/@types/form/field-config.type";

export interface IEquipmentFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IEquipmentFormModalProps extends THandlerComponentProps<TFormHandlerStore<TEquipmentData, TEquipmentResponse, IEquipmentFormModalExtraProps>> {
}

const EquipmentTypeSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableEquipmentTypes = useSearchableEquipmentTypes({});
  const { t } = useI18n();
  return (
    <SearchableInputWrapper<IEquipmentType>
      {...props}
      modal={true}
      useSearchable={() => searchableEquipmentTypes}
      getLabel={(item) => {
        if (!item?.name) return buildSentence(t, 'select', 'equipment', 'type');
        return item.name;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => { return { id: item.id, name: item.name } }}
      shouldFilter={false}
      multiple={false}
    />
  );
});

const EquipmentFormModal = React.memo(function EquipmentFormModal({
  storeKey,
  store,
}: IEquipmentFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, 'form', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const isEditing = store((state) => state.isEditing);
  const isSubmitting = store((state) => state.isSubmitting);

  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);

  const storeFields = store((state) => state.fields);

  const fields = useMemo(() => ({
    ...storeFields,
    equipmentType: {
      ...(storeFields as TFieldConfigObject<TEquipmentData>).equipmentType,
      label: buildSentence(t, 'equipment', 'type'),
      placeholder: buildSentence(t, 'select', 'equipment', 'type'),
      type: 'custom' as const,
      Component: EquipmentTypeSelect,
    },
    name: {
      ...(storeFields as TFieldConfigObject<TEquipmentData>).name,
      label: buildSentence(t, 'name'),
      placeholder: buildSentence(t, 'enter', 'name'),
    },
    description: {
      ...(storeFields as TFieldConfigObject<TEquipmentData>).description,
      label: buildSentence(t, 'description'),
      placeholder: buildSentence(t, 'enter', 'description'),
    },
    serialNumber: {
      ...(storeFields as TFieldConfigObject<TEquipmentData>).serialNumber,
      label: buildSentence(t, 'serial', 'number'),
      placeholder: buildSentence(t, 'enter', 'serial', 'number'),
    },
    status: {
      ...(storeFields as TFieldConfigObject<TEquipmentData>).status,
      label: buildSentence(t, 'status'),
      placeholder: buildSentence(t, 'select', 'status'),
    },
  } as TFieldConfigObject<TEquipmentData>), [storeFields, t]);

  const inputs = useInput<TEquipmentData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TEquipmentData>;

  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  };

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
        {t('cancel')}
      </Button>
      <Button type="submit" disabled={isSubmitting} data-component-id={componentId}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? t('update') : t('add')}
      </Button>
    </div>
  ), [componentId, isEditing, onClose, isSubmitting, t]);

  return (
    <>
      <ModalForm<TEquipmentData, TEquipmentResponse, IEquipmentFormModalExtraProps>
        title={buildSentence(t, isEditing ? 'edit' : 'add', 'equipment')}
        description={buildSentence(t, isEditing ? 'edit' : 'add', 'a', 'new', 'equipment')}
        open={open}
        onOpenChange={onOpenChange}
        formStore={store}
        footerContent={formButtons}
        width="2xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.equipmentType as React.ReactNode}
            {inputs.name}
          </div>
          <div>
            {inputs.description}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.serialNumber}
            {inputs.status}
          </div>
        </div>
      </ModalForm>
    </>
  );
});

export default EquipmentFormModal;
