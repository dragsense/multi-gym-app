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
import { type ICamera } from "@shared/interfaces/camera.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { CameraFormModal, type ICameraFormModalExtraProps } from "@/components/admin/cameras";

// Services
import { createCamera, updateCamera } from "@/services/camera.api";
import { strictDeepMerge } from "@/utils";
import { CreateCameraDto, UpdateCameraDto } from "@shared/dtos";
import type { TCameraData } from '@shared/types/camera.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface ICameraFormProps extends THandlerComponentProps<TSingleHandlerStore<ICamera, any>> { }

export default function CameraForm({
  storeKey,
  store,
}: ICameraFormProps) {
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
    reset: state.reset,
  })));

  // React 19: Memoized initial values with deferred processing
  const INITIAL_VALUES: TCameraData = {
    name: "",
    description: "",
    protocol: "rtsp" as const,
    username: "",
    password: "",
    ipAddress: "",
    port: undefined,
    path: undefined,
    streamUrl: "",
    location: undefined,
    isActive: true,
  } as TCameraData;

  const initialValues = useMemo(() => {
    return strictDeepMerge<TCameraData>(INITIAL_VALUES, response ?? {});
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
    return isEditing ? updateCamera(response.id) : createCamera;
  }, [isEditing, response?.id]);

  const dto = useMemo(() => {
    return isEditing ? UpdateCameraDto : CreateCameraDto;
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
      <FormHandler<TCameraData, IMessageResponse, ICameraFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={CameraFormModal}
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
