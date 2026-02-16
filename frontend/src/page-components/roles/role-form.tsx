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
import { type IRole } from "@shared/interfaces";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { RoleFormModal, type IRoleFormModalExtraProps } from "@/components/admin/roles/forms/role-form-modal";

// Services
import { createRole, updateRole } from "@/services/roles.api";
import { strictDeepMerge } from "@/utils";
import { CreateRoleDto, UpdateRoleDto } from "@shared/dtos/role-dtos";
import type { TRoleData } from '@shared/types';

export type TRoleExtraProps = {
  // Add any extra props needed
}

interface IRoleFormProps extends THandlerComponentProps<TSingleHandlerStore<IRole, TRoleExtraProps>> { }

export default function RoleForm({
  storeKey,
  store
}: IRoleFormProps) {
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
    const INITIAL_VALUES: TRoleData = {
      name: "",
      code: "",
      description: "",
      rolePermissions: [],
    };
    return strictDeepMerge<TRoleData>(INITIAL_VALUES, response ?? {});
  }, [response]);

  // React 19: Handlers with transitions
  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction('none');
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    return isEditing ? updateRole(response.id) : createRole;
  }, [isEditing, response?.id]);
  const dto = isEditing ? UpdateRoleDto : CreateRoleDto;

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  return (
    <div data-component-id={componentId}>
      <FormHandler<TRoleData, any, IRoleFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={RoleFormModal}
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
