// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import type { ITask, TCreateTaskIssueReportData } from "@shared/interfaces/task.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { TaskIssueReportFormModal } from "@/components/admin";
import type { ITaskIssueReportFormModalExtraProps } from "@/components/admin";

// Services
import { addTaskIssueReport, updateTaskIssueReport } from "@/services/task/task-issue-reports.api";
import { strictDeepMerge } from "@/utils";
import { EIssueReportStatus, EIssueReportSeverity } from "@shared/enums/task.enum";
import { CreateTaskIssueReportDto, UpdateTaskIssueReportDto } from "@shared/dtos";
import type { ITaskIssueReport } from "@shared/interfaces/task.interface";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface ITaskIssueReportFormProps extends THandlerComponentProps<TSingleHandlerStore<ITaskIssueReport, any>> {}

export default function TaskIssueReportForm({ storeKey, store }: ITaskIssueReportFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  const { action, response, extra, isLoading, setAction, reset } = store(
    useShallow((state) => ({
      action: state.action,
      response: state.response,
      extra: state.extra,
      isLoading: state.isLoading,
      setAction: state.setAction,
      reset: state.reset,
    }))
  );

 
  const taskId = extra?.taskId;

  const INITIAL_VALUES: TCreateTaskIssueReportData = {
    title: "",
    description: "",
    status: EIssueReportStatus.OPEN,
    severity: EIssueReportSeverity.MEDIUM,
  };

  // React 19: Memoized initial values with deferred processing
  const initialValues = useMemo(() => {
    return strictDeepMerge<TCreateTaskIssueReportData>(INITIAL_VALUES, response || {});
  }, [INITIAL_VALUES, response]);

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    if (!taskId) return null;
    return isEditing && response?.id
      ? (data: TCreateTaskIssueReportData) => updateTaskIssueReport(taskId)(response.id, data)
      : (data: TCreateTaskIssueReportData) => addTaskIssueReport(taskId)(data);
  }, [isEditing, taskId, response?.id]);

  // React 19: Memoized DTO to prevent unnecessary re-renders
  const dto = useMemo(() => {
    return isEditing ? UpdateTaskIssueReportDto : CreateTaskIssueReportDto;
  }, [isEditing]);

  if (action !== "createOrUpdate") {
    return null;
  }

  if (!mutationFn) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }


  return (
    <div data-component-id={componentId}>
      <FormHandler<TCreateTaskIssueReportData, ITaskIssueReport, ITaskIssueReportFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={TaskIssueReportFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          startTransition(() => {
            if (taskId) {
              queryClient.invalidateQueries({ queryKey: [`task-${taskId}-issue-reports-list`] });
            }
            handleClose();
          });
        }}
        formProps={{
          open: action === "createOrUpdate",
          onClose: handleClose,
        }}
      />
    </div>
  );
}

