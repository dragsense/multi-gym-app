import { useId, useMemo, useCallback } from "react";
import { useApiQuery } from "@/hooks/use-api-query";

// Types
import type { ITaskIssueReport } from '@shared/interfaces/task.interface';
import type { ITask } from '@shared/interfaces/task.interface';
import type { TSingleHandlerStore } from "@/stores";

// Handlers
import { SingleHandler } from "@/handlers";

// Components
import { TaskIssueReportsDisplay } from "@/components/admin/tasks/components/issue-reports";

// Services
import { fetchTaskIssueReport, fetchTaskIssueReports, deleteTaskIssueReport } from '@/services/task/task-issue-reports.api';

// Page Components
import TaskIssueReportForm from "@/page-components/task/forms/task-issue-report-form";

interface ITaskIssueReportsTabProps {
  task: ITask;
  store: TSingleHandlerStore<ITask, any>;
}

export default function TaskIssueReportsTab({ task, store }: ITaskIssueReportsTabProps) {
  const componentId = useId();

  if (!task) return null;

  const ISSUE_REPORTS_STORE_KEY = `task-${task.id}-issue-reports`;

  // Fetch issue reports at page component level
  const queryFn = useMemo(() => fetchTaskIssueReports(task.id), [task.id]);
  
  const {
    data: issueReports = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery<ITaskIssueReport[]>(
    [`task-${task.id}-issue-reports-list`],
    async (params) => {
      const response = await queryFn({
        sortBy: "createdAt",
        sortOrder: "DESC",
        ...params,
      });
      return Array.isArray(response) ? response : [];
    },
    {}
  );

  // Delete handler at page component level
  const handleDelete = useCallback(
    async (issueReportId: string) => {
      await deleteTaskIssueReport(task.id)(issueReportId);
    },
    [task.id]
  );

  return (
    <div data-component-id={componentId}>
      <SingleHandler<ITaskIssueReport>
        queryFn={fetchTaskIssueReport(task.id)}
        initialParams={{}}
        storeKey={ISSUE_REPORTS_STORE_KEY}
        SingleComponent={() => null}
        actionComponents={[
          {
            action: 'createOrUpdate',
            comp: TaskIssueReportForm
          },
        ]}
      />

      <TaskIssueReportsDisplay
        taskId={task.id}
        storeKey={ISSUE_REPORTS_STORE_KEY}
        issueReports={issueReports}
        isLoading={isLoading}
        error={error}
        onRefetch={refetch}
        onDelete={handleDelete}
      />
    </div>
  );
}

