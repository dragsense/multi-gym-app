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
import type { ITask, TCreateTaskData } from "@shared/interfaces/task.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { TaskFormModal } from "@/components/admin";
import type { ITaskFormModalExtraProps } from "@/components/admin";

// Services
import { createTask, updateTask } from "@/services/task.api";
import { strictDeepMerge } from "@/utils";
import { ETaskStatus, ETaskPriority } from "@shared/enums/task.enum";
import { EScheduleFrequency } from "@shared/enums/schedule.enum";
import { CreateTaskDto, UpdateTaskDto, RecurrenceConfigDto } from "@shared/dtos";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface ITaskFormProps extends THandlerComponentProps<TSingleHandlerStore<ITask, any>> {}

export default function TaskForm({ storeKey, store }: ITaskFormProps) {
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

  const { action, response, isLoading, setAction, reset } = store(
    useShallow((state) => ({
      action: state.action,
      response: state.response,
      isLoading: state.isLoading,
      setAction: state.setAction,
      reset: state.reset,
    }))
  );

  const INITIAL_VALUES: TCreateTaskData = {
    title: "",
    description: "",
    status: ETaskStatus.TODO,
    priority: ETaskPriority.MEDIUM,
    startDateTime: new Date().toISOString(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    assignedTo: null,
    location: undefined,
    door: undefined,
    tags: [],
    enableRecurrence: false,
    recurrenceConfig: {
      frequency: EScheduleFrequency.ONCE,
      weekDays: [],
      monthDays: [],
    } as RecurrenceConfigDto,
    recurrenceEndDate: undefined,
  };

  // React 19: Memoized initial values with deferred processing
  const initialValues = useMemo(() => {
    return strictDeepMerge<TCreateTaskData>(INITIAL_VALUES, response ?? {});
  }, [INITIAL_VALUES, response?.id]);

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    return isEditing && response?.id
      ? (data: TCreateTaskData) => updateTask(response.id, data)
      : createTask;
  }, [isEditing, response?.id]);

  // React 19: Memoized DTO to prevent unnecessary re-renders
  const dto = useMemo(() => {
    return isEditing ? UpdateTaskDto : CreateTaskDto;
  }, [isEditing]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div data-component-id={componentId}>
      <FormHandler<TCreateTaskData, ITask, ITaskFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={TaskFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
            queryClient.invalidateQueries({ queryKey: [storeKey + "-calendar"] });
            queryClient.invalidateQueries({ queryKey: [storeKey] });
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

