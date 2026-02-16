import { useId, useMemo } from "react";
import { useApiQuery } from "@/hooks/use-api-query";

// Types
import type { ITask } from "@shared/interfaces/task.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { ITaskActivityLog } from "@shared/interfaces/task.interface";

// Components
import { TaskActivityLogsDisplay } from "@/components/admin/tasks/components/activity-logs";

// Services
import { fetchTaskActivityLogs } from "@/services/task/task-activity-logs.api";

interface ITaskActivityLogsTabProps {
  task: ITask;
  store: TSingleHandlerStore<ITask, any>;
}

export function TaskActivityLogsTab({ task }: ITaskActivityLogsTabProps) {
  const componentId = useId();

  if (!task) return null;

  // Fetch task activity logs
  const queryFn = useMemo(() => fetchTaskActivityLogs(task.id), [task.id]);

  const {
    data: activityLogsResponse,
    isLoading,
    error,
  } = useApiQuery<ITaskActivityLog[]>(
    [`task-${task.id}-activity-logs`],
    async (params) => {
      try {
        const response: any = await queryFn({
          sortBy: "createdAt",
          sortOrder: "DESC",
          ...params,
        });
        
        // Debug logging
        console.log('Activity logs response:', response);
        
        // Handle different response formats
        if (Array.isArray(response)) {
          return response;
        }
        if (response && typeof response === 'object') {
          // Check if response has a data property
          if (Array.isArray(response.data)) {
            return response.data;
          }
          // Check if response itself is the array (wrapped)
          if (Array.isArray(response)) {
            return response;
          }
        }
        return [];
      } catch (err) {
        console.error('Error fetching activity logs:', err);
        return [];
      }
    },
    {}
  );

  const activityLogs: ITaskActivityLog[] = useMemo(() => {
    if (!activityLogsResponse) return [];
    if (Array.isArray(activityLogsResponse)) {
      return activityLogsResponse;
    }
    // Handle wrapped response
    const response = activityLogsResponse as any;
    if (response && typeof response === 'object' && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  }, [activityLogsResponse]);

  return (
    <div data-component-id={componentId}>
      <TaskActivityLogsDisplay
        activityLogs={activityLogs}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}

