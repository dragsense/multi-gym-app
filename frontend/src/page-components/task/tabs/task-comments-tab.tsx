import { useId, useMemo, useCallback } from "react";
import { useApiQuery } from "@/hooks/use-api-query";

// Types
import type { ITaskComment } from '@shared/interfaces/task.interface';
import type { ITask } from '@shared/interfaces/task.interface';
import type { TSingleHandlerStore } from "@/stores";

// Handlers
import { SingleHandler } from "@/handlers";

// Components
import { TaskCommentsDisplay } from "@/components/admin/tasks/components/comments";

// Services
import { fetchTaskComment, fetchTaskComments, deleteTaskComment } from '@/services/task/task-comments.api';

// Page Components
import TaskCommentForm from "@/page-components/task/forms/task-comment-form";

interface ITaskCommentsTabProps {
  task: ITask;
  store: TSingleHandlerStore<ITask, any>;
}

export default function TaskCommentsTab({ task, store }: ITaskCommentsTabProps) {
  const componentId = useId();

  if (!task) return null;

  const COMMENTS_STORE_KEY = `task-${task.id}-comments`;

  // Fetch comments at page component level
  const queryFn = useMemo(() => fetchTaskComments(task.id), [task.id]);
  
  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery<ITaskComment[]>(
    [`task-${task.id}-comments-list`],
    async (params) => {
      const response = await queryFn({
        sortBy: "createdAt",
        sortOrder: "ASC",
        ...params,
      });
      return Array.isArray(response) ? response : [];
    },
    {}
  );

  // Delete handler at page component level
  const handleDelete = useCallback(
    async (commentId: string) => {
      await deleteTaskComment(task.id)(commentId);
    },
    [task.id]
  );

  return (
    <div data-component-id={componentId}>
      <SingleHandler<ITaskComment>
        queryFn={fetchTaskComment(task.id)}
        initialParams={{}}
        storeKey={COMMENTS_STORE_KEY}
        SingleComponent={() => null}
        actionComponents={[
          {
            action: 'createOrUpdate',
            comp: TaskCommentForm
          },
        ]}
      />

      <TaskCommentsDisplay
        taskId={task.id}
        storeKey={COMMENTS_STORE_KEY}
        comments={comments}
        isLoading={isLoading}
        error={error}
        onRefetch={refetch}
        onDelete={handleDelete}
      />
    </div>
  );
}

