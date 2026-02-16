// External Libraries
import React, { useId, useMemo, useTransition } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";
import { useSearchableTrainers, useSearchableTrainerServices } from "@/hooks/use-searchable";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import type { TCustomInputWrapper } from "@/@types/form/field-config.type";
import type { StaffDto, TrainerServiceDto } from "@shared/dtos";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TCreateServiceOfferData, TUpdateServiceOfferData } from "@shared/types/service-offer.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { FormErrors } from "@/components/shared-ui/form-errors";

export interface IServiceOfferFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IServiceOfferFormModalProps extends THandlerComponentProps<TFormHandlerStore<TCreateServiceOfferData | TUpdateServiceOfferData, IMessageResponse, IServiceOfferFormModalExtraProps>> { }

// Custom components
const TrainerSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableTrainers = useSearchableTrainers({});
  return (
    <SearchableInputWrapper<StaffDto>
      {...props}
      modal={true}
      useSearchable={() => searchableTrainers}
      getLabel={(item) => {
        if (!item?.user?.firstName) return null;
        return `${item.user?.firstName} ${item.user?.lastName} (${item.user?.email})`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return { id: item.id, user: item.user };
      }}
      shouldFilter={false}
    />
  );
});

const TrainerServiceSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableTrainerServices = useSearchableTrainerServices({});
  return (
    <SearchableInputWrapper<TrainerServiceDto>
      {...props}
      modal={true}
      useSearchable={() => searchableTrainerServices}
      getLabel={(item) => {
        if (!item?.title) return null;
        return item.title;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return { id: item.id, title: item.title };
      }}
      shouldFilter={false}
    />
  );
});

const ServiceOfferFormModal = React.memo(function ServiceOfferFormModal({
  storeKey,
  store,
}: IServiceOfferFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { user } = useAuthUser();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);
  const fields = store((state) => state.fields);
  const isSubmitting = store((state) => state.isSubmitting);
  const isEditing = store((state) => state.isEditing);

  const memoizedFields = useMemo(() => {
    const baseFields = fields as TFieldConfigObject<TCreateServiceOfferData>;
    return {
      ...baseFields,
      trainer: {
        ...baseFields.trainer,
        type: "custom" as const,
        Component: TrainerSelect,
        visible: () => user?.level !== EUserLevels.STAFF,
      },
      trainerService: {
        ...baseFields.trainerService,
        type: "custom" as const,
        Component: TrainerServiceSelect,
      },
    } as TFieldConfigObject<TCreateServiceOfferData>;
  }, [fields, user]);

  const inputs = useInput<TCreateServiceOfferData>({
    fields: memoizedFields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateServiceOfferData>;

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
        {isEditing ? t('updateServiceOffer') : t('createServiceOffer')}
      </Button>
    </div>
  ), [onClose, isSubmitting, isEditing, t, startTransition]);

  return (
    <ModalForm<TCreateServiceOfferData | TUpdateServiceOfferData, IMessageResponse, IServiceOfferFormModalExtraProps>
      title={isEditing ? t('updateServiceOffer') : t('createServiceOffer')}
      description={isEditing ? t('updateServiceOfferInformation') : t('createNewServiceOffer')}
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
          <h3 className="text-sm font-semibold mb-3">{t('serviceOfferDetails')}</h3>
          <div className="grid grid-cols-1 gap-4">
            {inputs.name}
            {inputs.offerPrice}
            {inputs.discount}
            {inputs.trainerService}
            {inputs.trainer}
            {inputs.status}
          </div>
        </div>
      </div>
      <FormErrors />
    </ModalForm>
  );
});

export default ServiceOfferFormModal;

