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

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { TCreateBannerImageData, TUpdateBannerImageData } from "@shared/types/advertisement.type";
import FileUpload from "@/components/shared-ui/file-upload";
import type { IFileUpload } from "@shared/interfaces/file-upload.interface";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

export interface IBannerImageFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IBannerImageFormModalProps extends THandlerComponentProps<TFormHandlerStore<TCreateBannerImageData | TUpdateBannerImageData, IMessageResponse, IBannerImageFormModalExtraProps>> { }

const BannerImageFormModal = React.memo(function BannerImageFormModal({
  storeKey,
  store,
}: IBannerImageFormModalProps) {
  // React 19: Essential IDs and transitions - MUST be called before any early returns
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
    const storeFields = fields as TFieldConfigObject<TCreateBannerImageData | TUpdateBannerImageData>;
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
    } as TFieldConfigObject<TCreateBannerImageData | TUpdateBannerImageData>;
  }, [fields]);

  const inputs = useInput<TCreateBannerImageData | TUpdateBannerImageData>({
    fields: memoizedFields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateBannerImageData | TUpdateBannerImageData>;

  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => onClose());
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
          startTransition(() => onClose());
        }}
      >
        {t('cancel')}
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? t('updateBannerImage') : t('createBannerImage')}
      </Button>
    </div>
  ), [onClose, isSubmitting, isEditing, t, startTransition]);

  return (
    <ModalForm<TCreateBannerImageData | TUpdateBannerImageData, IMessageResponse, IBannerImageFormModalExtraProps>
      title={isEditing ? t('updateBannerImage') : t('createBannerImage')}
      description={isEditing ? t('updateBannerImageInformation') : t('uploadNewBannerImage')}
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
          <h3 className="text-sm font-semibold mb-3">{t('bannerImageDetails')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {inputs.name}
            {inputs.image as React.ReactNode}
          </div>
        </div>
      </div>
    </ModalForm>
  );
});

export default BannerImageFormModal;

