// External Libraries
import React, { useId, useMemo, useTransition } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { TFileUploadData } from "@shared/types";

export interface IFileFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}


interface IFileFormModalProps extends THandlerComponentProps<TFormHandlerStore<TFileUploadData, IMessageResponse, IFileFormModalExtraProps>> { }

const FileCreateFormModal = React.memo(function FileCreateModal({
  storeKey,
  store,
}: IFileFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);
  const fields = store((state) => state.fields);

  // React 19: Memoized fields for better performance
  const memoizedFields = useMemo(() => fields, [fields]);

  const inputs = useInput<TFileUploadData>({
    fields: memoizedFields,
    showRequiredAsterisk: true,
  }) as FormInputs<TFileUploadData>;

  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => onClose());
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
          startTransition(() => onClose());
        }}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={false}>
        {false && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create File
      </Button>
    </div>
  ), [onClose]);

  return (
    <ModalForm<TFileUploadData, IMessageResponse, IFileFormModalExtraProps>
      title="Create File Record"
      description="Create a file record with custom URL"
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="2xl"
      data-component-id={componentId}
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold mb-3">File Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inputs.name}
            {inputs.type}
          </div>
        </div>

        {/* URL & Path Info */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Path & Location</h3>
          <div className="grid grid-cols-1 gap-4">
            {inputs.file as React.ReactNode}
            {inputs.folder}
            {inputs.url}
          </div>
        </div>
      </div>
    </ModalForm>
  );
});

export default FileCreateFormModal;

