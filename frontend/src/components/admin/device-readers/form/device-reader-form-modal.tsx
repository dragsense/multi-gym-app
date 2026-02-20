// External Libraries
import React, { useId, useMemo, useTransition } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableLocations } from "@/hooks/use-searchable";
import { getSelectedLocation } from "@/utils/location-storage";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TCreateDeviceReaderData, TUpdateDeviceReaderData } from "@shared/types/device-reader.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { FormErrors } from "@/components/shared-ui/form-errors";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import type { ILocation } from "@shared/interfaces/location.interface";
import type { TCustomInputWrapper } from "@/@types/form/field-config.type";

export interface IDeviceReaderFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IDeviceReaderFormModalProps extends THandlerComponentProps<TFormHandlerStore<TCreateDeviceReaderData | TUpdateDeviceReaderData, IMessageResponse, IDeviceReaderFormModalExtraProps>> { }

const LocationSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableLocations = useSearchableLocations({});
  const { t } = useI18n();
  const selectedLocation = getSelectedLocation();

  React.useEffect(() => {
    if (selectedLocation && !props.value && props.onChange) {
      props.onChange({
        id: selectedLocation.id,
        name: selectedLocation.name,
      } as ILocation);
    }
  }, [selectedLocation, props.value, props.onChange]);

  return (
    <SearchableInputWrapper<ILocation>
      {...props}
      modal={true}
      useSearchable={() => searchableLocations}
      getLabel={(item) => {
        if (!item) return buildSentence(t, 'select', 'location');
        return `${item.name}${item.address ? ` - ${item.address}` : ''}`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => ({ id: item.id, name: item.name, address: item.address } as ILocation)}
      shouldFilter={false}
      disabled={!!selectedLocation || props.disabled}
    />
  );
});

const DeviceReaderFormModal = React.memo(function DeviceReaderFormModal({
  storeKey,
  store,
}: IDeviceReaderFormModalProps) {
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

  const memoizedFields = useMemo(() => ({
    ...fields,
    location: {
      ...fields.location,
      type: 'custom' as const,
      Component: LocationSelect,
      label: buildSentence(t, 'location'),
      placeholder: buildSentence(t, 'select', 'location'),
    },
  }), [fields, t]);

  const inputs = useInput<TCreateDeviceReaderData>({
    fields: memoizedFields as Parameters<typeof useInput<TCreateDeviceReaderData>>[0]['fields'],
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateDeviceReaderData>;

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
        {isEditing ? t('updateDeviceReader') : t('createDeviceReader')}
      </Button>
    </div>
  ), [onClose, isSubmitting, isEditing, t, startTransition]);

  return (
    <ModalForm<TCreateDeviceReaderData | TUpdateDeviceReaderData, IMessageResponse, IDeviceReaderFormModalExtraProps>
      title={isEditing ? t('updateDeviceReader') : t('createDeviceReader')}
      description={isEditing ? t('updateDeviceReaderInformation') : t('createNewDeviceReader')}
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
          <h3 className="text-sm font-semibold mb-3">{t('deviceReaderDetails')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputs.deviceName}
            {inputs.macAddress}
            {inputs.status}
            {inputs.location as React.ReactNode}
          </div>
        </div>
      </div>
      <FormErrors />
    </ModalForm>
  );
});

export default DeviceReaderFormModal;

