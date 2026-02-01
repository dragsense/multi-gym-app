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
import type { TCreateLocationData, TUpdateLocationData } from "@shared/types/location.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { IFileUpload } from "@shared/interfaces/file-upload.interface";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { FormErrors } from "@/components/shared-ui/form-errors";
import FileUpload from "@/components/shared-ui/file-upload";

export interface ILocationFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface ILocationFormModalProps extends THandlerComponentProps<TFormHandlerStore<TCreateLocationData | TUpdateLocationData, IMessageResponse, ILocationFormModalExtraProps>> { }

const LocationFormModal = React.memo(function LocationFormModal({
  storeKey,
  store,
}: ILocationFormModalProps) {
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

  // React 19: Memoized fields for better performance with FileUpload component
  const memoizedFields = useMemo(() => {
    const storeFields = fields as TFieldConfigObject<TCreateLocationData | TUpdateLocationData>;
    return {
      ...storeFields,
      image: {
        ...storeFields.image,
        type: 'custom' as const,
        Component: ({ value, onChange }: { value: File | IFileUpload | null, onChange: (file: File | null) => void }) => (
          <FileUpload
            value={value}
            onChange={onChange}
            variant="rectangle"
            maxSizeInMB={10}
            acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
          />
        ),
      },
    } as TFieldConfigObject<TCreateLocationData | TUpdateLocationData>;
  }, [fields]);

  const inputs = useInput<TCreateLocationData | TUpdateLocationData>({
    fields: memoizedFields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateLocationData | TUpdateLocationData>;

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
        {isEditing ? t('updateLocation') : t('createLocation')}
      </Button>
    </div>
  ), [onClose, isSubmitting, isEditing, t, startTransition]);

  return (
    <ModalForm<TCreateLocationData | TUpdateLocationData, IMessageResponse, ILocationFormModalExtraProps>
      title={isEditing ? t('updateLocation') : t('createLocation')}
      description={isEditing ? t('updateLocationInformation') : t('createNewLocation')}
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
          <h3 className="text-sm font-semibold mb-3">{t('locationDetails')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {inputs.name}
            {inputs.address}
            {inputs.image as React.ReactNode}
          </div>
        </div>
      </div>
      <FormErrors />
    </ModalForm>
  );
});

export default LocationFormModal;

