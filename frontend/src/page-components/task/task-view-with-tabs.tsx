import { useId, useTransition } from "react";
import { useShallow } from "zustand/shallow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  MessageSquare,
  Clock,
  Bug,
} from "lucide-react";

// Types
import type { ITask } from "@shared/interfaces/task.interface";
import type { TSingleHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { ISingleHandlerState } from "@/@types/handler-types/single.type";

// Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { TaskDetailContent } from "@/components/admin/tasks/view/task-view";

// Page Components
import TaskCommentsTab from "./tabs/task-comments-tab";
import TaskTimeLogsTab from "./tabs/task-time-logs-tab";
import TaskIssueReportsTab from "./tabs/task-issue-reports-tab";
import { TaskOverviewTab } from "./tabs/task-overview-tab";
import { TaskActivityLogsTab } from "./tabs/task-activity-logs-tab";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useQueryClient } from "@tanstack/react-query";

interface ITaskViewWithTabsProps extends THandlerComponentProps<TSingleHandlerStore<ITask, any>> {}

export default function TaskViewWithTabs({ storeKey, store }: ITaskViewWithTabsProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  if (!store) return null;

  const selector = useShallow((state: ISingleHandlerState<ITask, any>) => ({
    response: state.response,
    action: state.action,
    setAction: state.setAction,
    reset: state.reset,
  }));

  const { response: task, action, setAction, reset } = store(selector);

  if (!task) return null;

  // Check if this is a calendar event (id contains @)
  const isCalendarEvent = task.id?.includes('@') || task.isCalendarEvent;

  const handleCloseView = () => {
    startTransition(() => {
      reset();
      queryClient.invalidateQueries({ queryKey: ["task", task?.id] });
      queryClient.invalidateQueries({ queryKey: ["task-comments", task?.id] });
      queryClient.invalidateQueries({ queryKey: ["task-issue-reports", task?.id] });
      queryClient.invalidateQueries({ queryKey: ["task-time-logs", task?.id] });
    });
  };

  const onEdit = (task: ITask) => {
    startTransition(() => {
      setAction("createOrUpdate", task.id);
    });
  };

  const onDelete = (task: ITask) => {
    startTransition(() => {
      setAction("delete", task.id);
    });
  };

  const onComplete = (task: ITask) => {
    startTransition(() => {
      setAction("completeTask", task.id);
    });
  };

  const onUpdateStatus = (task: ITask) => {
    startTransition(() => {
      setAction("updateStatus", task.id);
    });
  };

  const onUpdateProgress = (task: ITask) => {
    startTransition(() => {
      setAction("updateProgress", task.id);
    });
  };

  const onCancel = (task: ITask) => {
    startTransition(() => {
      setAction("cancel", task.id);
    });
  };

  return (
    <Dialog
      open={action === "view"}
      onOpenChange={handleCloseView}
      data-component-id={componentId}
    >
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <AppDialog
          title={buildSentence(t, "task", "details")}
          description={buildSentence(
            t,
            "view",
            "detailed",
            "information",
            "about",
            "this",
            "task"
          )}
        >
          <div className="space-y-4">
            <TaskDetailContent
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
              onUpdateStatus={onUpdateStatus}
              onUpdateProgress={onUpdateProgress}
              onCancel={onCancel}
              store={store}
            />

            {/* Tabs for different sections - only show overview for calendar events */}
            {isCalendarEvent ? (
              <div className="mt-4">
                <TaskOverviewTab task={task} store={store} />
              </div>
            ) : (
              <Tabs defaultValue="overview" className="w-full h-[460px]">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">
                    <Activity className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="comments">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments
                  </TabsTrigger>
                  <TabsTrigger value="time-logs">
                    <Clock className="h-4 w-4 mr-2" />
                    Time Logs
                  </TabsTrigger>
                  <TabsTrigger value="issue-reports">
                    <Bug className="h-4 w-4 mr-2" />
                    Issue Reports
                  </TabsTrigger>
                  <TabsTrigger value="activity-logs">
                    <Activity className="h-4 w-4 mr-2" />
                    Activity Logs
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <TaskOverviewTab task={task} store={store} />
                </TabsContent>

                <TabsContent value="comments" className="mt-4">
                  <TaskCommentsTab task={task} store={store} />
                </TabsContent>

                <TabsContent value="time-logs" className="mt-4">
                  <TaskTimeLogsTab task={task} store={store} />
                </TabsContent>

                <TabsContent value="issue-reports" className="mt-4">
                  <TaskIssueReportsTab task={task} store={store} />
                </TabsContent>

                <TabsContent value="activity-logs" className="mt-4">
                  <TaskActivityLogsTab task={task} store={store} />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
}

