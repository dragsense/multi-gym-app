// External Libraries
import React, { useId, useMemo, useTransition } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableDeviceReaders, useSearchableCameras } from "@/hooks/use-searchable";
import type { TCustomInputWrapper } from "@/@types/form/field-config.type";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TDoorData, TUpdateDoorData } from "@shared/types/door.type";
import type { TDoorResponse } from "@shared/interfaces/door.interface";
import type { IDeviceReader } from "@shared/interfaces/device-reader.interface";
import type { ICamera } from "@shared/interfaces/camera.interface";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { FormErrors } from "@/components/shared-ui/form-errors";

export interface IDoorFormModalExtraProps {
  open: boolean;
  onClose: () => void;
  locationId?: string;
}

interface IDoorFormModalProps extends THandlerComponentProps<TFormHandlerStore<TDoorData, TDoorResponse, IDoorFormModalExtraProps>> { }

// Custom component for device reader select
const DeviceReaderSelect = React.memo(
  (props: TCustomInputWrapper) => {
    const { t } = useI18n();
    
    return (
      <SearchableInputWrapper<IDeviceReader>
        {...props}
        modal={true}
        useSearchable={() => useSearchableDeviceReaders({ initialParams: { limit: 100 } })}
        getLabel={(item) => {
          if (!item) return buildSentence(t, 'select', 'device', 'reader');
          return `${item.deviceName} (${item.macAddress})`;
        }}
        getKey={(item) => item.id.toString()}
        getValue={(item) => {
          return {
            id: item.id,
            deviceName: item.deviceName,
            macAddress: item.macAddress,
          } as IDeviceReader;
        }}
        shouldFilter={false}
      />
    );
  }
);

// Custom component for camera select
const CameraSelect = React.memo(
  (props: TCustomInputWrapper & { locationId?: string }) => {
    const { t } = useI18n();
    const { locationId } = props;
    
    return (
      <SearchableInputWrapper<ICamera>
        {...props}
        modal={true}
        useSearchable={() => useSearchableCameras({ locationId, initialParams: { limit: 100 } })}
        getLabel={(item) => {
          if (!item) return buildSentence(t, 'select', 'camera');
          return item.name || item.id;
        }}
        getKey={(item) => item.id.toString()}
        getValue={(item) => {
          return {
            id: item.id,
            name: item.name,
            description: item.description,
          } as ICamera;
        }}
        shouldFilter={false}
      />
    );
  }
);

const DoorFormModal = React.memo(function DoorFormModal({
  storeKey,
  store,
}: IDoorFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, 'form', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);
  const locationId = store((state) => state.extra.locationId);
  const fields = store((state) => state.fields);
  const isSubmitting = store((state) => state.isSubmitting);
  const isEditing = store((state) => state.isEditing);

  const memoizedFields = useMemo(() => {
    return {
      ...fields,
      name: {
        ...(fields as TFieldConfigObject<TDoorData>).name,
        label: buildSentence(t, 'name'),
        placeholder: buildSentence(t, 'enter', 'name'),
      },
      description: {
        ...(fields as TFieldConfigObject<TDoorData>).description,
        label: buildSentence(t, 'description'),
        placeholder: buildSentence(t, 'enter', 'description'),
      },
      locationId: {
        ...(fields as TFieldConfigObject<TDoorData>).locationId,
        label: buildSentence(t, 'location'),
        placeholder: buildSentence(t, 'select', 'location'),
        ...(locationId && { value: locationId }),
      },
      deviceReader: {
        ...(fields as TFieldConfigObject<TDoorData>).deviceReader,
        type: 'custom' as const,
        Component: DeviceReaderSelect,
        label: buildSentence(t, 'device', 'reader'),
        placeholder: buildSentence(t, 'select', 'device', 'reader'),
      },
      camera: {
        ...(fields as TFieldConfigObject<TDoorData>).camera,
        type: 'custom' as const,
        Component: (props: TCustomInputWrapper) => <CameraSelect {...props} locationId={locationId} />,
        label: buildSentence(t, 'camera'),
        placeholder: buildSentence(t, 'select', 'camera'),
      },
    } as TFieldConfigObject<TDoorData>;
  }, [fields, t, locationId]);

  const inputs = useInput<TDoorData | TUpdateDoorData>({
    fields: memoizedFields,
    showRequiredAsterisk: true,
  }) as FormInputs<TDoorData | TUpdateDoorData>;

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
        {isEditing ? t('update') : t('add')}
      </Button>
    </div>
  ), [onClose, isSubmitting, isEditing, t, startTransition]);

  return (
    <ModalForm<TDoorData, TDoorResponse, IDoorFormModalExtraProps>
      title={buildSentence(t, isEditing ? 'edit' : 'add', 'door')}
      description={buildSentence(t, isEditing ? 'edit' : 'add', 'a', 'new', 'door')}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="2xl"
      data-component-id={componentId}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {inputs.name}
          {inputs.deviceReader}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {inputs.camera}
        </div>
        <div>
          {inputs.description}
        </div>
      </div>
      <FormErrors />
    </ModalForm>
  );
});

export default DoorFormModal;
