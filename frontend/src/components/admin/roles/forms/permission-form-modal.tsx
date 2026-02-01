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
import type { TCustomInputWrapper, TFieldConfigObject } from "@/@types/form/field-config.type";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { useSearchableResources } from "@/hooks/use-searchable";
import type { IResource } from "@shared/interfaces";
import type { TPermissionData } from "@shared/types";

export interface IPermissionFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}


const ResourceSelect = React.memo(
  (props: TCustomInputWrapper) => {
    return <SearchableInputWrapper<IResource>
      {...props}
      modal={true}
      useSearchable={() => useSearchableResources({})}
      getLabel={(item) => {
        if (!item) return 'Select Resource';
        return `${item.displayName}`
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => { return { id: item.id, displayName: item.displayName } }}
      shouldFilter={false}
    />
  }
);



interface IPermissionFormModalProps extends THandlerComponentProps<TFormHandlerStore<TPermissionData, any, IPermissionFormModalExtraProps>> { }

export const PermissionFormModal = React.memo(function PermissionFormModal({
  storeKey,
  store,
}: IPermissionFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const isEditing = store((state) => state.isEditing);
  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);

  // React 19: Memoized fields for better performance
  const storeFields = store((state) => state.fields)


  // React 19: Memoized fields for better performance
  const fields = useMemo(() => ({
    ...storeFields,
    resource: {
      ...storeFields.resource,
      type: 'custom' as const,
      Component: ResourceSelect
    },


  } as TFieldConfigObject<TPermissionData>), [storeFields]);

  const inputs = useInput<TPermissionData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TPermissionData>;

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
      <ModalForm<TPermissionData, any, IPermissionFormModalExtraProps>
        title={`${isEditing ? "Edit" : "Add"} Permission`}
        description={`${isEditing ? "Edit" : "Add a new"} Permission`}
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
              {inputs.displayName}
            </div>
          </div>

          {/* Permission Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Permission Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {inputs.action}
              {inputs.resource as ReactNode}
            </div>
          </div>

     {/*      <div>
            <h3 className="text-sm font-semibold mb-3">Included Columns</h3>
            <div className="grid grid-cols-1 gap-6 items-start">
              {inputs.includedColumns}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">Excluded Columns</h3>
            <div className="grid grid-cols-1 gap-6 items-start">
              {inputs.excludedColumns}
            </div>
          </div> */}

          {/* Additional Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Additional Details</h3>
            <div className="grid grid-cols-1 gap-6 items-start">
              {inputs.description}
            </div>
          </div>
        </div>
      </ModalForm>
    </>
  );
});

