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
import { type IDoor } from "@shared/interfaces/door.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { DoorFormModal, type IDoorFormModalExtraProps } from "@/components/admin/locations/doors";

// Services
import { createDoor, updateDoor } from "@/services/location/door.api";
import { strictDeepMerge } from "@/utils";
import { CreateDoorDto, UpdateDoorDto } from "@shared/dtos";
import type { TDoorData } from '@shared/types/door.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TDoorsExtraProps = {
  locationId?: string;
};

interface IDoorsFormProps extends THandlerComponentProps<TSingleHandlerStore<IDoor, TDoorsExtraProps>> { }

export default function DoorsForm({
  storeKey,
  store,
}: IDoorsFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }

  const { action, response, isLoading, setAction, reset, extra } = store(useShallow(state => ({
    action: state.action,
    response: state.response,
    isLoading: state.isLoading,
    setAction: state.setAction,
    reset: state.reset,
    extra: state.extra,
  })));

  const INITIAL_VALUES: TDoorData = {
    name: "",
    description: "",
    deviceReader: undefined,
    locationId: extra?.locationId || "",
  };

  // React 19: Memoized initial values with deferred processing
  const initialValues = useMemo(() => {
    return strictDeepMerge<TDoorData>(INITIAL_VALUES, response ?? {});
  }, [INITIAL_VALUES, response?.id, extra?.locationId]);

  // React 19: Enhanced handler with transitions
  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction('none');
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    return isEditing ? updateDoor(response.id) : createDoor;
  }, [isEditing, response?.id]);

  const dto = useMemo(() => {
    return isEditing ? UpdateDoorDto : CreateDoorDto;
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
      <FormHandler<TDoorData, IMessageResponse, IDoorFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={DoorFormModal}
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
          locationId: extra?.locationId,
        }}
      />
    </div>
  );
}
