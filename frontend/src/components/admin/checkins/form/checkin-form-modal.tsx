// External Libraries
import React, { ReactNode, useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableUsers, useSearchableLocations, useSearchableDoors } from "@/hooks/use-searchable";
import { getSelectedLocation } from "@/utils/location-storage";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TCheckinData } from "@shared/types/checkin.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { UserDto } from "@shared/dtos";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TCustomInputWrapper, TFieldConfigObject } from "@/@types/form/field-config.type";
import type { IUser } from '@shared/interfaces/user.interface';
import type { ILocation } from "@shared/interfaces/location.interface";
import type { IDoor } from "@shared/interfaces/door.interface";
import { useFormContext } from "react-hook-form";

// Custom components - must be defined before early return
const UserSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableUsers = useSearchableUsers({});
  const { t } = useI18n();
  return (
    <SearchableInputWrapper<UserDto>
      {...props}
      modal={true}
      useSearchable={() => searchableUsers}
      getLabel={(item) => {
        if (!item) return buildSentence(t, "select", "user");
        return `${item.firstName} ${item.lastName} (${item.email})`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return {
          id: item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
        };
      }}
      shouldFilter={false}
    />
  );
});

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

const DoorSelect = React.memo((props: TCustomInputWrapper) => {
  const { watch } = useFormContext();
  const location = watch('location');
  const locationId = location?.id;
  const searchableDoors = useSearchableDoors({ locationId: locationId || undefined });
  const { t } = useI18n();
  
  return (
    <SearchableInputWrapper<IDoor>
      {...props}
      modal={true}
      useSearchable={() => searchableDoors}
      getLabel={(item) => {
        if (!item) return buildSentence(t, 'select', 'door');
        const loc = (item as any).location?.name || (item as any).location?.address;
        return loc ? `${item.name || item.id} (${loc})` : (item.name || item.id);
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          locationId: item.locationId,
        } as IDoor;
      }}
      shouldFilter={false}
      disabled={!locationId}
    />
  );
});

export interface ICheckinFormModalExtraProps {
  open: boolean;
  onClose: () => void;
  user: IUser
}

interface ICheckinFormModalProps extends THandlerComponentProps<TFormHandlerStore<TCheckinData, IMessageResponse, ICheckinFormModalExtraProps>> {
}

const CheckinFormModal = React.memo(function CheckinFormModal({
  storeKey,
  store,
}: ICheckinFormModalProps) {
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
  const user = store((state) => state.extra.user);

  // React 19: Memoized fields for better performance
  const storeFields = store((state) => state.fields);

  // React 19: Memoized fields for better performance
  const fields = useMemo(() => ({
    ...storeFields,
    user: {
      ...storeFields.user,
      type: "custom" as const,
      Component: UserSelect,
      label: buildSentence(t, "user"),
      disabled: !!user
    },
    checkInTime:{
      ...storeFields.checkInTime,
      label:buildSentence(t,"check-in","time")+" (HH:MM)"
    },
    checkOutTime:{
      ...storeFields.checkOutTime,
      label:buildSentence(t,"check-out","time")+" (HH:MM)"
    },
    location: {
      ...storeFields.location,
      type: "custom" as const,
      Component: LocationSelect,
      label: buildSentence(t, 'location'),
      disabled: !!getSelectedLocation(),
    },
    door: {
      ...storeFields.door,
      type: "custom" as const,
      Component: DoorSelect,
      label: buildSentence(t, 'door'),
    },
    notes:{
      ...storeFields.notes,
      placeholder:buildSentence(t,"write notes")
    }

  } as TFieldConfigObject<TCheckinData>), [storeFields, t]);

  const inputs = useInput<TCheckinData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCheckinData>;

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
    <ModalForm<TCheckinData, IMessageResponse, ICheckinFormModalExtraProps>
      title={buildSentence(t, isEditing ? 'edit' : 'add', 'check-in')}
      description={buildSentence(t, isEditing ? 'update' : 'add', 'check-in', 'information')}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="3xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {inputs.user as ReactNode }
          {inputs.timezone}
          {inputs.checkInTime}
          {inputs.checkOutTime}
          {inputs.location}
          {inputs.door}
        </div>
        <div className="space-y-4">
          {inputs.notes}
        </div>
      </div>
    </ModalForm>
  );
});

export default CheckinFormModal;

