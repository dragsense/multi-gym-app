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
import type { ITaskComment, TCreateTaskCommentData, TUpdateTaskCommentData } from "@shared/interfaces/task.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { TaskCommentFormModal } from "@/components/admin";
import type { ITaskCommentFormModalExtraProps } from "@/components/admin";

// Services
import { createTaskComment, updateTaskComment } from "@/services/task/task-comments.api";
import { strictDeepMerge } from "@/utils";
import { CreateTaskCommentDto, UpdateTaskCommentDto } from "@shared/dtos/task-dtos/task-comment.dto";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface ITaskCommentFormProps extends THandlerComponentProps<TSingleHandlerStore<ITaskComment, any>> {}

export default function TaskCommentForm({ storeKey, store }: ITaskCommentFormProps) {

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

  const INITIAL_VALUES: TCreateTaskCommentData = {
    content: "",
  };

  // React 19: Memoized initial values with deferred processing
  const initialValues = useMemo(() => {
    return strictDeepMerge<TCreateTaskCommentData>(INITIAL_VALUES, response ?? {});
  }, [INITIAL_VALUES, response?.id]);

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
    });
  }, [reset, setAction, startTransition]);

  const taskId = extra?.taskId;
  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    if (!taskId) return null;
    return isEditing && response?.id
      ? (data: TCreateTaskCommentData | TUpdateTaskCommentData) => updateTaskComment(taskId)(response.id, data)
      : (data: TCreateTaskCommentData) => createTaskComment(taskId)(data);
  }, [isEditing, taskId, response?.id]);

  // React 19: Memoized DTO to prevent unnecessary re-renders
  const dto = useMemo(() => {
    return isEditing ? UpdateTaskCommentDto : CreateTaskCommentDto;
  }, [isEditing]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mutationFn) {
    return null;
  }

  return (
    <div data-component-id={componentId}>
      <FormHandler<TCreateTaskCommentData, ITaskComment, ITaskCommentFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={TaskCommentFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [`task-${taskId}-comments-list`] });
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

