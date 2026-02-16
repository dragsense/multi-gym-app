// External Libraries
import { useShallow } from 'zustand/shallow';
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition, useDeferredValue } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IResource } from "@shared/interfaces";
import type { TUpdateResourceData } from "@shared/types/role/resource.type";
// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { ResourceFormModal, type IResourceFormModalExtraProps } from "@/components/admin/roles/forms/resource-form-modal";

// Services
import { updateResource } from "@/services/roles.api";
import { strictDeepMerge } from "@/utils";
import { UpdateResourceDto } from "@shared/dtos/role-dtos";



export type TResourceExtraProps = {
  // Add any extra props needed
}

interface IResourceFormProps extends THandlerComponentProps<TSingleHandlerStore<IResource, TResourceExtraProps>> {}

export default function ResourceForm({
  storeKey,
  store
}: IResourceFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  
  const queryClient = useQueryClient();

  if (!store) {
    return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
  }

  const { action, response, isLoading, setAction, reset } = store(useShallow(state => ({
    action: state.action,
    response: state.response,
    isLoading: state.isLoading,
    setAction: state.setAction,
    reset: state.reset
  })));

  // React 19: Memoized initial values with deferred processing
  const initialValues = useMemo(() => {
    const INITIAL_VALUES: TUpdateResourceData = {
      name: "",
      displayName: "",
      description: "",
      isActive: true,
    };
    return strictDeepMerge<TUpdateResourceData>(INITIAL_VALUES, response ?? {});
  }, [response]);
  
  // React 19: Deferred values for performance
  const deferredInitialValues = useDeferredValue(initialValues);

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // React 19: Handlers with transitions
  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction('none');
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = updateResource(response.id);
  const dto = UpdateResourceDto;

  return (
    <div data-component-id={componentId}>
      <FormHandler<TUpdateResourceData, any, IResourceFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={ResourceFormModal}
        storeKey={storeKey}
        initialValues={deferredInitialValues}
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
