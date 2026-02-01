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
import { type IEquipmentReservation } from "@shared/interfaces/equipment-reservation.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { EquipmentReservationFormModal, type IEquipmentReservationFormModalExtraProps } from "@/components/admin/equipment-reservations/form";

// Services
import { createEquipmentReservation, updateEquipmentReservation } from "@/services/equipment-reservation.api";
import { strictDeepMerge } from "@/utils";
import { CreateEquipmentReservationDto, UpdateEquipmentReservationDto } from "@shared/dtos";
import type { TEquipmentReservationData } from '@shared/types/equipment-reservation.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TEquipmentReservationExtraProps = {};

interface IEquipmentReservationFormProps extends THandlerComponentProps<TSingleHandlerStore<IEquipmentReservation, TEquipmentReservationExtraProps>> { }

export default function EquipmentReservationForm({
  storeKey,
  store,
}: IEquipmentReservationFormProps) {
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

  const INITIAL_VALUES: TEquipmentReservationData = {
    equipment: null,
    startDateTime: "",
    endDateTime: "",
    notes: "",
  };

  // React 19: Memoized initial values with deferred processing
  const initialValues = useMemo(() => {
    return strictDeepMerge<TEquipmentReservationData>(INITIAL_VALUES, response as unknown as TEquipmentReservationData);
  }, [INITIAL_VALUES, response?.id]);

  // React 19: Enhanced handler with transitions
  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction('none');
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  // Transform equipment object to equipmentId before submission
  const transformMutationFn = useCallback(async (data: CreateEquipmentReservationDto | UpdateEquipmentReservationDto) => {
    return isEditing ? updateEquipmentReservation(response.id)(data) : createEquipmentReservation(data as CreateEquipmentReservationDto);
  }, [isEditing, response?.id]);

  const dto = useMemo(() => {
    return isEditing ? UpdateEquipmentReservationDto : CreateEquipmentReservationDto;
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
      <FormHandler<TEquipmentReservationData, IMessageResponse, IEquipmentReservationFormModalExtraProps>
        mutationFn={transformMutationFn}
        FormComponent={EquipmentReservationFormModal}
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
