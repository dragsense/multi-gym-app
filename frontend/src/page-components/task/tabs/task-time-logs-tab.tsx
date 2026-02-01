import { useId, useMemo, useCallback } from "react";
import { useApiQuery } from "@/hooks/use-api-query";

// Types
import type { ITaskTimeLog } from '@shared/interfaces/task.interface';
import type { ITask } from '@shared/interfaces/task.interface';
import type { TSingleHandlerStore } from "@/stores";

// Handlers
import { SingleHandler } from "@/handlers";

// Components
import { TaskTimeLogsDisplay } from "@/components/admin/tasks/components/time-logs";

// Services
import { fetchTaskTimeLog, fetchTaskTimeLogs, deleteTaskTimeLog } from '@/services/task/task-time-logs.api';

// Page Components
import TaskTimeLogForm from "@/page-components/task/forms/task-time-log-form";

interface ITaskTimeLogsTabProps {
  task: ITask;
  store: TSingleHandlerStore<ITask, any>;
}

export default function TaskTimeLogsTab({ task, store }: ITaskTimeLogsTabProps) {
  const componentId = useId();

  if (!task) return null;

  const TIME_LOGS_STORE_KEY = `task-${task.id}-time-logs`;

  // Fetch time logs at page component level
  const queryFn = useMemo(() => fetchTaskTimeLogs(task.id), [task.id]);
  
  const {
    data: timeLogs = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery<ITaskTimeLog[]>(
    [`task-${task.id}-time-logs-list`],
    async (params) => {
      const response = await queryFn({
        sortBy: "startTime",
        sortOrder: "DESC",
        ...params,
      });
      return Array.isArray(response) ? response : [];
    },
    {}
  );

  // Delete handler at page component level
  const handleDelete = useCallback(
    async (timeLogId: string) => {
      await deleteTaskTimeLog(task.id)(timeLogId);
    },
    [task.id]
  );

  return (
    <div data-component-id={componentId}>
      <SingleHandler<ITaskTimeLog>
        queryFn={fetchTaskTimeLog(task.id)}
        initialParams={{}}
        storeKey={TIME_LOGS_STORE_KEY}
        SingleComponent={() => null}
        actionComponents={[
          {
            action: 'createOrUpdate',
            comp: TaskTimeLogForm
          },
        ]}
      />

      <TaskTimeLogsDisplay
        taskId={task.id}
        storeKey={TIME_LOGS_STORE_KEY}
        timeLogs={timeLogs}
        isLoading={isLoading}
        error={error}
        onRefetch={refetch}
        onDelete={handleDelete}
      />
    </div>
  );
}

