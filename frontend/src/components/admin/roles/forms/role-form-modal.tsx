// External Libraries
import React, { useMemo, useId, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";

// Types
import type { TFormHandlerStore } from "@/stores";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TRoleData } from "@shared/types";
import type { TCustomInputWrapper, TFieldConfigObject } from "@/@types/form/field-config.type";
import type { PermissionDto } from "@shared/dtos/role-dtos/permission.dto";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { useSearchablePermissions } from "@/hooks/use-searchable";

export interface IRoleFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

  // React 19: Memoized fields for better performance
  const PermissionsSelect = React.memo(
    (props: TCustomInputWrapper) => (
      <SearchableInputWrapper<PermissionDto>
        {...props}
        modal={true}
        useSearchable={() => useSearchablePermissions({})}
        getLabel={(item) => {
          if (!item) return 'Select Permission';
          return item.displayName || item.name || 'Unknown Permission';
        }}
        getKey={(item) => item?.id?.toString() || ''}
        getValue={(item) => { 
          if (!item || !item.id) return { id: '', displayName: '' };
          return { id: item.id, displayName: item.displayName || item.name || '' } 
        }}
        shouldFilter={false}
        multiple={true}
      />
    )
  );

interface IRoleFormModalProps extends THandlerComponentProps<TFormHandlerStore<TRoleData, any, IRoleFormModalExtraProps>> { }

export const RoleFormModal = React.memo(function RoleFormModal({
  storeKey,
  store,
}: IRoleFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const isEditing = store((state) => state.isEditing);
  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);

  const storeFields = store((state) => state.fields)




  // React 19: Memoized fields for better performance
  const fields = useMemo(() => ({
    ...storeFields,
    rolePermissions: {
      ...(storeFields.rolePermissions || {}),
      type: 'custom' as const,
      Component: PermissionsSelect
    },
  } as TFieldConfigObject<TRoleData>), [storeFields]);

  const inputs = useInput<TRoleData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TRoleData>;

  // React 19: Smooth modal state changes
  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
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
          startTransition(() => {
            onClose();
          });
        }}
        data-component-id={componentId}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={false} data-component-id={componentId}>
        {false && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? "Update" : "Add"}
      </Button>
    </div>
  ), [componentId, isEditing, onClose]);


  return (
    <>
      <ModalForm<TRoleData, any, IRoleFormModalExtraProps>
        title={`${isEditing ? "Edit" : "Add"} Role`}
        description={`${isEditing ? "Edit" : "Add a new"} Role`}
        open={open}
        onOpenChange={onOpenChange}
        formStore={store}
        footerContent={formButtons}
        width="2xl"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Basic Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {inputs.name}
              {inputs.code}
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Additional Details</h3>
            <div className="grid grid-cols-1 gap-6 items-start">
              {inputs.description}
              {inputs.rolePermissions}
            </div>
          </div>
        </div>
      </ModalForm>
    </>
  );
});

