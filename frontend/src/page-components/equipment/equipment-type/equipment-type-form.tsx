// External Libraries
import { useShallow } from 'zustand/shallow';
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IEquipmentType } from "@shared/interfaces/equipment-reservation.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { EquipmentTypesFormModal, type IEquipmentTypesFormModalExtraProps } from "@/components/admin/equipment-types";

// Services
import { createEquipmentType, updateEquipmentType } from "@/services/equipment-type.api";
import { strictDeepMerge } from "@/utils";
import { CreateEquipmentTypeDto, UpdateEquipmentTypeDto } from "@shared/dtos";
import type { TEquipmentTypeData } from '@shared/types/equipment-reservation.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TEquipmentTypesExtraProps = {};

interface IEquipmentTypesFormProps extends THandlerComponentProps<TSingleHandlerStore<IEquipmentType, TEquipmentTypesExtraProps>> { }

export default function EquipmentTypeForm({
  storeKey,
  store,
}: IEquipmentTypesFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }

  const { action, response, isLoading, setAction, reset } = store(useShallow(state => ({
    action: state.action,
    response: state.response,
    isLoading: state.isLoading,
    setAction: state.setAction,
    reset: state.reset
  })));

  const INITIAL_VALUES: TEquipmentTypeData = {
    name: "",
    description: "",
  };

  // React 19: Memoized initial values with deferred processing
  const initialValues = useMemo(() => {
    return strictDeepMerge<TEquipmentTypeData>(INITIAL_VALUES, response ?? {});
  }, [INITIAL_VALUES, response?.id]);

  // React 19: Enhanced handler with transitions
  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction('none');
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    return isEditing ? updateEquipmentType(response.id) : createEquipmentType;
  }, [isEditing, response?.id]);

  const dto = useMemo(() => {
    return isEditing ? UpdateEquipmentTypeDto : CreateEquipmentTypeDto;
  }, [isEditing]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div data-component-id={componentId}>
      <FormHandler<TEquipmentTypeData, IMessageResponse, IEquipmentTypesFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={EquipmentTypesFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
            handleClose();
          });
        }}
        formProps={{
          open: action === 'createOrUpdate',
          onClose: handleClose,
        }}
      />
    </div>
  );
}
