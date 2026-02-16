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
import { type ICheckin } from "@shared/interfaces/checkin.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { CheckinFormModal, type ICheckinFormModalExtraProps } from "@/components/admin/checkins";

// Services
import { createCheckin, updateCheckin } from "@/services/checkin.api";
import { strictDeepMerge } from "@/utils";
import { CreateCheckinDto, UpdateCheckinDto } from "@shared/dtos";
import type { TCheckinData } from '@shared/types/checkin.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { IUser } from '@shared/interfaces/user.interface';

export type TCheckinExtraProps = {
  user?: IUser;
};

interface ICheckinFormProps extends THandlerComponentProps<TSingleHandlerStore<ICheckin, TCheckinExtraProps>> { }

export default function CheckinForm({
  storeKey,
  store,
}: ICheckinFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
  }

  const { action, response, isLoading, setAction, reset , extra} = store(useShallow(state => ({
    action: state.action,
    response: state.response,
    isLoading: state.isLoading,
    setAction: state.setAction,
    reset: state.reset,
    extra: state.extra
  })));


  const user = extra.user ?? null;


  // React 19: Memoized initial values with deferred processing
  const getCurrentTimezone = () => {
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return "UTC";
  };

  const INITIAL_VALUES: TCheckinData = {
    user: user,
    checkInTime: new Date().toISOString(),
    checkOutTime: undefined,
    location: undefined,
    door: undefined,
    timezone: getCurrentTimezone(),
    notes: "",
  } as TCheckinData;

  const initialValues = useMemo(() => {
    return strictDeepMerge<TCheckinData>(INITIAL_VALUES, response ?? {});
  }, [response]);

  // React 19: Enhanced handler with transitions
  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction('none');
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    return isEditing ? updateCheckin(response.id) : createCheckin;
  }, [isEditing, response?.id]);

  const dto = useMemo(() => {
    return isEditing ? UpdateCheckinDto : CreateCheckinDto;
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
      <FormHandler<TCheckinData, IMessageResponse, ICheckinFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={CheckinFormModal}
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
          user: user,
        }}
      />
    </div>
  );
}

