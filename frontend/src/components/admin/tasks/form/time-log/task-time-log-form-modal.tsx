// External Libraries
import React, { useMemo, useId, useTransition, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TCreateTaskTimeLogData } from "@shared/interfaces/task.interface";
import type { ITaskTimeLog } from "@shared/interfaces/task.interface";

// Components
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type {
  TFieldConfigObject,
} from "@/@types/form/field-config.type";

export interface ITaskTimeLogFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface ITaskTimeLogFormModalProps
  extends THandlerComponentProps<
    TFormHandlerStore<TCreateTaskTimeLogData, ITaskTimeLog, ITaskTimeLogFormModalExtraProps>
  > {}

const TaskTimeLogFormModal = React.memo(function TaskTimeLogFormModal({
  storeKey,
  store,
}: ITaskTimeLogFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const isEditing = store ? store((state) => state.isEditing) : false;
  const isSubmitting = store ? store((state) => state.isSubmitting) : false;
  const open = store ? store((state) => state.extra.open) : false;
  const onClose = store ? store((state) => state.extra.onClose) : () => {};
  const storeFields = store ? store((state) => state.fields) : {};

  const fields = useMemo(
    () =>
      ({
        ...(storeFields as TFieldConfigObject<TCreateTaskTimeLogData>),
        duration: {
          ...(storeFields as TFieldConfigObject<TCreateTaskTimeLogData>).duration,
          label: buildSentence(t, "duration", "minutes"),
        },
        description: {
          ...(storeFields as TFieldConfigObject<TCreateTaskTimeLogData>).description,
          label: buildSentence(t, "description"),
        },
        startTime: {
          ...(storeFields as TFieldConfigObject<TCreateTaskTimeLogData>).startTime,
          label: buildSentence(t, "start", "time"),
        },
        isBillable: {
          ...(storeFields as TFieldConfigObject<TCreateTaskTimeLogData>).isBillable,
          label: buildSentence(t, "is", "billable"),
        },
      } as TFieldConfigObject<TCreateTaskTimeLogData>),
    [storeFields, t]
  );

  const inputs = useInput<TCreateTaskTimeLogData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateTaskTimeLogData>;

  const onOpenChange = useCallback((state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  }, [onClose, startTransition]);

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
        {buildSentence(t, "cancel")}
      </Button>
      <Button type="submit" disabled={isSubmitting} data-component-id={componentId}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buildSentence(t, isEditing ? "update" : "create")}
      </Button>
    </div>
  ), [componentId, isEditing, onClose, isSubmitting, t]);

  if (!store) {
    return (
      <div>
        {buildSentence(t, "form", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  return (
    <ModalForm<TCreateTaskTimeLogData, ITaskTimeLog, ITaskTimeLogFormModalExtraProps>
      title={buildSentence(t, isEditing ? "edit" : "log", "time")}
      description={buildSentence(t, isEditing ? "update" : "log", "time", "spent", "on", "this", "task")}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="lg"
    >
      <div className="space-y-4">
        {inputs.duration}
        {inputs.description}
        {inputs.startTime}
      </div>
    </ModalForm>
  );
});

export default TaskTimeLogFormModal;

