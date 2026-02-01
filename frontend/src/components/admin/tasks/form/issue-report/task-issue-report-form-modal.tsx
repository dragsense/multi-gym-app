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
import type { TCreateTaskIssueReportData } from "@shared/interfaces/task.interface";
import type { ITaskIssueReport } from "@shared/interfaces/task.interface";

// Components
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type {
  TFieldConfigObject,
} from "@/@types/form/field-config.type";



export interface ITaskIssueReportFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface ITaskIssueReportFormModalProps
  extends THandlerComponentProps<
    TFormHandlerStore<TCreateTaskIssueReportData, ITaskIssueReport, ITaskIssueReportFormModalExtraProps>
  > {}

const TaskIssueReportFormModal = React.memo(function TaskIssueReportFormModal({
  storeKey,
  store,
}: ITaskIssueReportFormModalProps) {
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
        ...(storeFields as TFieldConfigObject<TCreateTaskIssueReportData>),
        title: {
          ...(storeFields as TFieldConfigObject<TCreateTaskIssueReportData>).title,
          label: buildSentence(t, "title"),
        },
        description: {
          ...(storeFields as TFieldConfigObject<TCreateTaskIssueReportData>).description,
          label: buildSentence(t, "description"),
        },
        status: {
          ...(storeFields as TFieldConfigObject<TCreateTaskIssueReportData>).status,
          label: buildSentence(t, "status"),
        },
        severity: {
          ...(storeFields as TFieldConfigObject<TCreateTaskIssueReportData>).severity,
          label: buildSentence(t, "severity"),
        },
      
      } as TFieldConfigObject<TCreateTaskIssueReportData>),
    [storeFields, t]
  );

  const inputs = useInput<TCreateTaskIssueReportData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateTaskIssueReportData>;

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
    <ModalForm<TCreateTaskIssueReportData, ITaskIssueReport, ITaskIssueReportFormModalExtraProps>
      title={buildSentence(t, isEditing ? "edit" : "report", "issue")}
      description={buildSentence(t, isEditing ? "update" : "report", "a", "new", "issue", "for", "this", "task")}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="lg"
    >
      <div className="space-y-4">
        {inputs.title}
        {inputs.description}
        {inputs.status}
        {inputs.severity}
      </div>
    </ModalForm>
  );
});

export default TaskIssueReportFormModal;

