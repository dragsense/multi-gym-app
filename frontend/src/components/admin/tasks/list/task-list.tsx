// React & Hooks
import { useState, useId, useTransition, useCallback, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// External libraries
import { Plus, AlertCircle } from "lucide-react";

// Types
import { type ITask } from "@shared/interfaces/task.interface";
import { ETaskStatus, ETaskPriority } from "@shared/enums/task.enum";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Custom UI Components
import { Table as TTable } from "@/components/table-ui/table";
import { List as TList } from "@/components/list-ui/list";
import { ViewToggle } from "@/components/shared-ui/view-toggle";
import { AppCard } from "@/components/layout-ui/app-card";

// Local
import { TaskFilters } from "./task-filters";
import { taskItemViews } from "./task-item-views";

// Stores
import { type TListHandlerStore, type TSingleHandlerStore } from "@/stores";

// Config
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import { formatDate } from "@/lib/utils";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";

export interface ITaskListExtraProps { }

interface ITaskListProps extends TListHandlerComponentProps<
  TListHandlerStore<ITask, any, ITaskListExtraProps>,
  TSingleHandlerStore<ITask, any>
> { }

type ViewType = "table" | "list";

const priorityColors = {
  [ETaskPriority.LOW]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [ETaskPriority.MEDIUM]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  [ETaskPriority.HIGH]: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  [ETaskPriority.URGENT]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusColors = {
  [ETaskStatus.TODO]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  [ETaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [ETaskStatus.IN_REVIEW]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  [ETaskStatus.DONE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  [ETaskStatus.CANCELLED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function TaskList({
  storeKey,
  store,
  singleStore
}: ITaskListProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { settings } = useUserSettings();

  if (!store) {
    return `${buildSentence(t, 'list', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  if (!singleStore) {
    return `${buildSentence(t, 'single', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const setAction = singleStore(state => state.setAction);
  const setListAction = store(state => state.setAction);

  const [currentView, setCurrentView] = useState<ViewType>("table");

  const handleCreate = useCallback(() => {
    startTransition(() => {
      setAction('createOrUpdate');
    });
  }, [setAction, startTransition]);

  const handleEdit = useCallback((id: string) => {
    startTransition(() => {
      setAction('createOrUpdate', id);
    });
  }, [setAction, startTransition]);

  const handleDelete = useCallback((id: string) => {
    startTransition(() => {
      setListAction('delete', id);
    });
  }, [setListAction, startTransition]);

  const handleView = useCallback((id: string) => {
    startTransition(() => {
      setAction('view', id);
    });
  }, [setAction, startTransition]);

  const isOverdue = (task: ITask) => {
    if (!task.dueDate || task.status === ETaskStatus.DONE) return false;
    return new Date(task.dueDate) < new Date();
  };

  const { columns, listItem } = taskItemViews({
    handleEdit,
    handleDelete,
    handleView,
    isOverdue,
    priorityColors,
    statusColors,
    settings,
  });

  return (
    <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewType)} data-component-id={componentId}>
      <div className="flex flex-1 justify-between items-start md:items-center gap-2 flex-wrap mb-4">
        <TaskFilters store={store} />
        <ViewToggle componentId={componentId} />
        <Button
          onClick={handleCreate}
          data-component-id={componentId}
        >
          <Plus /> <span className="hidden sm:inline">Add Task</span>
        </Button>
      </div>

      <TabsContent value="table">
        <AppCard className="px-0">
          <TTable<ITask>
            listStore={store}
            columns={columns}
            emptyMessage="No tasks found"
            showPagination={true}
          />
        </AppCard>
      </TabsContent>

      <TabsContent value="list">
        <div>
          <TList<ITask>
            listStore={store}
            emptyMessage="No tasks found"
            showPagination={true}
            renderItem={(task) => (
              <Card className={cn(
                "hover:shadow-md transition-shadow cursor-pointer",
                isOverdue(task) && "border-red-500 border-2"
              )} onClick={() => handleView(task.id)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {task.title}
                        {isOverdue(task) && (
                          <Badge variant="destructive" className="ml-2">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                      </CardTitle>
                      {task.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {task.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                      <Badge className={statusColors[task.status]}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {task.assignedTo && (
                        <span>
                          Assigned to: {task.assignedTo.profile?.firstName || task.assignedTo.email}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={cn(
                          isOverdue(task) && "text-red-600 font-semibold"
                        )}>
                          Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Progress: {task.progress}%</span>
                    </div>
                  </div>
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {task.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

