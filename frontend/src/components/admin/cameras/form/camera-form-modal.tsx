// External Libraries
import React, { ReactNode, useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableLocations } from "@/hooks/use-searchable";
import { getSelectedLocation } from "@/utils/location-storage";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TCameraData } from "@shared/types/camera.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import { ECameraProtocol } from "@shared/enums";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TCustomInputWrapper, TFieldConfigObject } from "@/@types/form/field-config.type";
import type { ILocation } from "@shared/interfaces/location.interface";

// Custom components - must be defined before early return
const LocationSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableLocations = useSearchableLocations({});
  const { t } = useI18n();
  const selectedLocation = getSelectedLocation();
  
  // Set default value if location is selected in localStorage
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
      getValue={(item) => {
        return {
          id: item.id,
          name: item.name,
          address: item.address,
        } as ILocation;
      }}
      shouldFilter={false}
      disabled={!!selectedLocation || props.disabled}
    />
  );
});

export interface ICameraFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface ICameraFormModalProps extends THandlerComponentProps<TFormHandlerStore<TCameraData, IMessageResponse, ICameraFormModalExtraProps>> {
}

const CameraFormModal = React.memo(function CameraFormModal({
  storeKey,
  store,
}: ICameraFormModalProps) {
  // React 19: Essential IDs and transitions
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

  // React 19: Memoized fields for better performance
  const storeFields = store((state) => state.fields);

  // React 19: Memoized fields for better performance
  const fields = useMemo(() => ({
    ...storeFields,
    name: {
      ...storeFields.name,
      label: buildSentence(t, 'name'),
      placeholder: buildSentence(t, 'enter', 'camera', 'name'),
    },
    protocol: {
      ...storeFields.protocol,
      label: buildSentence(t, 'protocol'),
      options: Object.values(ECameraProtocol).map(value => ({
        value,
        label: value.toUpperCase(),
      })),
    },
    username: {
      ...storeFields.username,
      label: buildSentence(t, 'username'),
      placeholder: buildSentence(t, 'enter', 'username'),
    },
    password: {
      ...storeFields.password,
      label: buildSentence(t, 'password'),
      placeholder: buildSentence(t, 'enter', 'password'),
    },
    ipAddress: {
      ...storeFields.ipAddress,
      label: buildSentence(t, 'ip', 'address'),
      placeholder: '192.168.1.100',
    },
    port: {
      ...storeFields.port,
      label: buildSentence(t, 'port'),
      placeholder: '554',
    },
    path: {
      ...storeFields.path,
      label: buildSentence(t, 'path'),
      placeholder: '/stream',
    },
    streamUrl: {
      ...storeFields.streamUrl,
      label: buildSentence(t, "streamUrl"),
      placeholder: "rtsp://192.168.1.100:554/stream",
      bottomAdornment: "Optional Stream URL",
    },
    location: {
      ...storeFields.location,
      type: "custom" as const,
      Component: LocationSelect,
      label: buildSentence(t, 'location'),
      disabled: !!getSelectedLocation(),
    },
    description: {
      ...storeFields.description,
      label: buildSentence(t, 'description'),
      placeholder: buildSentence(t, "write", "description"),
    },
    isActive: {
      ...storeFields.isActive,
      label: buildSentence(t, 'active', 'status'),
    },
  } as TFieldConfigObject<TCameraData>), [storeFields, t]);

  const inputs = useInput<TCameraData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCameraData>;

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
        disabled={isSubmitting}
        data-component-id={componentId}
      >
        {buildSentence(t, 'cancel')}
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        data-component-id={componentId}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? buildSentence(t, 'update') : buildSentence(t, 'add')}
      </Button>
    </div>
  ), [isSubmitting, isEditing, componentId, t, onClose, startTransition]);

  return (
    <ModalForm<TCameraData, IMessageResponse, ICameraFormModalExtraProps>
      title={buildSentence(t, isEditing ? 'edit' : 'add', 'camera')}
      description={buildSentence(t, isEditing ? 'update' : 'add', 'camera', 'information')}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="3xl"
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{buildSentence(t, 'basic', 'information')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.name}
            {inputs.description}
            {inputs.isActive}
          </div>
        </div>

        {/* Connection Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{buildSentence(t, 'connection', 'details')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {inputs.protocol}

            {inputs.ipAddress}
            {inputs.port}
            {inputs.path}
            {inputs.streamUrl}
          </div>
        </div>

        {/* Authentication */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{buildSentence(t, 'authentication')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.username}
            {inputs.password}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{buildSentence(t, 'location')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.location}
          </div>
        </div>
      </div>
    </ModalForm>
  );
});

export default CameraFormModal;
