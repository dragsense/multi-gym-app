import React, { useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableEquipment } from "@/hooks/use-searchable";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";

import type { TFormHandlerStore } from "@/stores";
import type { TEquipmentReservationData } from "@shared/types/equipment-reservation.type";
import type { TEquipmentReservationResponse } from "@shared/interfaces/equipment-reservation.interface";
import type { IEquipment } from "@shared/interfaces/equipment-reservation.interface";

import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject, TCustomInputWrapper } from "@/@types/form/field-config.type";

export interface IEquipmentReservationFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IEquipmentReservationFormModalProps extends THandlerComponentProps<TFormHandlerStore<TEquipmentReservationData, TEquipmentReservationResponse, IEquipmentReservationFormModalExtraProps>> {
}

const EquipmentSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableEquipment = useSearchableEquipment({});
  const { t } = useI18n();
  return (
    <SearchableInputWrapper<IEquipment>
      {...props}
      modal={true}
      useSearchable={() => searchableEquipment}
      getLabel={(item) => {
        if (!item?.name) return buildSentence(t, 'select', 'equipment');
        const typeName = item.equipmentType?.name ? ` (${item.equipmentType.name}) - ${item.status}` : '';
        return `${item.name}${typeName}`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => { return { id: item.id, name: item.name, equipmentType: item.equipmentType, status: item.status } }}
      shouldFilter={false}
      multiple={false}
    />
  );
});

const EquipmentReservationFormModal = React.memo(function EquipmentReservationFormModal({
  storeKey,
  store,
}: IEquipmentReservationFormModalProps) {
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
    equipment: {
      ...(storeFields as TFieldConfigObject<TEquipmentReservationData>).equipment,
      label: buildSentence(t, 'equipment'),
      placeholder: buildSentence(t, 'select', 'equipment'),
      type: 'custom' as const,
      Component: EquipmentSelect,
    },
    startDateTime: {
      ...(storeFields as TFieldConfigObject<TEquipmentReservationData>).startDateTime,
      label: buildSentence(t, 'start', 'date', 'time'),
      placeholder: buildSentence(t, 'select', 'start', 'date', 'time'),
    },
    endDateTime: {
      ...(storeFields as TFieldConfigObject<TEquipmentReservationData>).endDateTime,
      label: buildSentence(t, 'end', 'date', 'time'),
      placeholder: buildSentence(t, 'select', 'end', 'date', 'time'),
    },
    notes: {
      ...(storeFields as TFieldConfigObject<TEquipmentReservationData>).notes,
      label: buildSentence(t, 'notes'),
      placeholder: buildSentence(t, 'enter', 'notes'),
    },
  } as TFieldConfigObject<TEquipmentReservationData>), [storeFields, t]);

  const inputs = useInput<TEquipmentReservationData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TEquipmentReservationData>;

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
      <ModalForm<TEquipmentReservationData, TEquipmentReservationResponse, IEquipmentReservationFormModalExtraProps>
        title={buildSentence(t, isEditing ? 'edit' : 'add', 'equipment', 'reservation')}
        description={buildSentence(t, isEditing ? 'edit' : 'add', 'a', 'new', 'equipment', 'reservation')}
        open={open}
        onOpenChange={onOpenChange}
        formStore={store}
        footerContent={formButtons}
        width="2xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.equipment as React.ReactNode}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.startDateTime}
            {inputs.endDateTime}
          </div>
          <div>
            {inputs.notes}
          </div>
        </div>
      </ModalForm>
    </>
  );
});

export default EquipmentReservationFormModal;
