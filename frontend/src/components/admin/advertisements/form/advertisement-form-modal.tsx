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
import type { TCustomInputWrapper } from "@/@types/form/field-config.type";
import type { TCreateAdvertisementData, TUpdateAdvertisementData } from "@shared/types/advertisement.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { BannerImageListSelector } from "./banner-image-list-selector";
import { FormErrors } from "@/components/shared-ui/form-errors";
import type { IBannerImage } from "@shared/interfaces/advertisement.interface";

export interface IAdvertisementFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IAdvertisementFormModalProps extends THandlerComponentProps<TFormHandlerStore<TCreateAdvertisementData | TUpdateAdvertisementData, IMessageResponse, IAdvertisementFormModalExtraProps>> { }

const BannerImageSelect = React.memo(
  (props: TCustomInputWrapper) => {
    return (
      <BannerImageListSelector
        value={props.value as IBannerImage | null}
        onChange={(value) => props.onChange(value)}
        disabled={props.disabled}
      />
    );
  }
);

const AdvertisementFormModal = React.memo(function AdvertisementFormModal({
  storeKey,
  store,
}: IAdvertisementFormModalProps) {
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
    const storeFields = fields as TFieldConfigObject<TCreateAdvertisementData>;
    return {
      ...storeFields,
      bannerImage: {
        ...storeFields.bannerImage,
        type: 'custom' as const,
        Component: BannerImageSelect,
      },
    } as TFieldConfigObject<TCreateAdvertisementData>;
  }, [fields]);

  const inputs = useInput<TCreateAdvertisementData>({
    fields: memoizedFields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateAdvertisementData>;

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
        {isEditing ? t('updateAdvertisement') : t('createAdvertisement')}
      </Button>
    </div>
  ), [onClose, isSubmitting, isEditing, t, startTransition]);

  return (
    <ModalForm<TCreateAdvertisementData | TUpdateAdvertisementData, IMessageResponse, IAdvertisementFormModalExtraProps>
      title={isEditing ? t('updateAdvertisement') : t('createAdvertisement')}
      description={isEditing ? t('updateAdvertisementInformation') : t('createNewAdvertisement')}
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
          <h3 className="text-sm font-semibold mb-3">{t('advertisementDetails')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {inputs.title}
            {inputs.status}
          </div>
        </div>

        {/* Dates */}
        <div>
          <h3 className="text-sm font-semibold mb-3">{t('schedule')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputs.startDate}
            {inputs.endDate}
          </div>
        </div>

        {/* Banner Image & Link */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('bannerImage')}</h3>
            {inputs.bannerImage as React.ReactNode}
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('websiteLink')}</h3>
            {inputs.websiteLink}
          </div>
        </div>
      </div>
      <FormErrors />
    </ModalForm>
  );
});

export default AdvertisementFormModal;

