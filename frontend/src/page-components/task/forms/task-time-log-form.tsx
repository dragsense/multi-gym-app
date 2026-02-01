// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition, useEffect } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import type { ITask, TCreateTaskTimeLogData } from "@shared/interfaces/task.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { TaskTimeLogFormModal } from "@/components/admin";
import type { ITaskTimeLogFormModalExtraProps } from "@/components/admin";

// Services
import { addTaskTimeLog, updateTaskTimeLog } from "@/services/task.api";
import { strictDeepMerge } from "@/utils";
import { CreateTaskTimeLogDto, UpdateTaskTimeLogDto } from "@shared/dtos";
import type { ITaskTimeLog } from "@shared/interfaces/task.interface";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface ITaskTimeLogFormProps extends THandlerComponentProps<TSingleHandlerStore<ITaskTimeLog, any>> { }

export default function TaskTimeLogForm({ storeKey, store }: ITaskTimeLogFormProps) {
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


  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const taskId = extra?.taskId;


// Updated to handle edit time log
const initialValues = useMemo(() => {
  if (extra?.timeLog) {
    return {
      duration: extra.timeLog.duration,
      description: extra.timeLog.description ?? "",
      startTime: new Date(extra.timeLog.startTime).toISOString(),
    };
  }

  return {
    duration: 60,
    description: "",
    startTime: new Date().toISOString(),
  };
}, [extra?.timeLog]);


  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
    });
  }, [reset, setAction, startTransition]);
  //Updated to handle edit time log
  const isEditing = !!extra?.timeLog;


// Updated to handle edit time log
const mutationFn = useMemo(() => {
  if (!taskId) return null;

  if (isEditing && extra?.timeLog?.id) {
    return (data: TCreateTaskTimeLogData) =>
      updateTaskTimeLog(taskId)(extra.timeLog.id, data);
  }

  return (data: TCreateTaskTimeLogData) =>
    addTaskTimeLog(taskId)(data);
}, [taskId, isEditing, extra?.timeLog?.id]);


  // React 19: Memoized DTO to prevent unnecessary re-renders
  const dto = useMemo(() => {
    return isEditing ? UpdateTaskTimeLogDto : CreateTaskTimeLogDto;
  }, [isEditing]);


  if (action !== "createOrUpdate") {
    return null;
  }

  if (!mutationFn) {
    return null;
  }

  return (
    <div data-component-id={componentId}>
      <FormHandler<TCreateTaskTimeLogData, ITaskTimeLog, ITaskTimeLogFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={TaskTimeLogFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          startTransition(() => {
            if (taskId) {
              queryClient.invalidateQueries({ queryKey: [`task-${taskId}-time-logs-list`] });
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

