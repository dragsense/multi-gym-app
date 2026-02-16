// External Libraries
import React, { useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";
// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TResourceData } from "@shared/types/role/resource.type";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";

export interface IResourceFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IResourceFormModalProps extends THandlerComponentProps<TFormHandlerStore<TResourceData, any, IResourceFormModalExtraProps>> { }

export const ResourceFormModal = React.memo(function ResourceFormModal({
  storeKey,
  store,
}: IResourceFormModalProps) {
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
  const fields = useMemo(() => store((state) => state.fields), [store]);



  const inputs = useInput<TResourceData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TResourceData>;

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
      <ModalForm<TResourceData, any, IResourceFormModalExtraProps>
        title={`${isEditing ? "Edit" : "Add"} Resource`}
        description={`${isEditing ? "Edit" : "Add a new"} Resource`}
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

          {/* Additional Details */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Additional Details</h3>
            <div className="grid grid-cols-1 gap-6 items-start">
              {inputs.description}
              {inputs.isActive}
            </div>
          </div>
        </div>
      </ModalForm>
    </>
  );
});

