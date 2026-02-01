import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Types
import type { ITask } from '@shared/interfaces/task.interface';

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { TaskList } from "@/components/admin/tasks";

// Services
import { fetchTasks, fetchTask, deleteTask, completeTask } from '@/services/task.api';

// Page Components
import { TaskForm, TaskDelete, TaskComplete, TaskStatusUpdate, TaskProgressUpdate, TaskViewWithTabs, TaskCancel } from "@/page-components/task";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { TaskListDto } from "@shared/dtos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List as ListIcon } from "lucide-react";
import TasksCalendar from "./calendar";
import { getSelectedLocation } from "@/utils/location-storage";

export default function TasksPage() {
    const queryClient = useQueryClient();
    const [view, setView] = useState<"list" | "calendar">("calendar");

    const TASKS_STORE_KEY = 'task';
    const location = getSelectedLocation();

    return (
        <PageInnerLayout Header={<Header />}>
            <SingleHandler<ITask>
                queryFn={fetchTask}
                initialParams={{
                    _relations: 'assignedTo',
                }}
                storeKey={TASKS_STORE_KEY}
                SingleComponent={TaskViewWithTabs}
                actionComponents={[
                    {
                        action: 'createOrUpdate',
                        comp: TaskForm
                    },
                    {
                        action: 'delete',
                        comp: TaskDelete
                    },
                    {
                        action: 'completeTask',
                        comp: TaskComplete
                    },
                    {
                        action: 'updateStatus',
                        comp: TaskStatusUpdate
                    },
                    {
                        action: 'updateProgress',
                        comp: TaskProgressUpdate
                    },
                    {
                        action: 'cancel',
                        comp: TaskCancel
                    },
                ]}
            />

            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="calendar" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Calendar
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <ListIcon className="h-4 w-4" />
                        List View
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calendar">
                    <TasksCalendar storeKey={TASKS_STORE_KEY} />
                </TabsContent>

                <TabsContent value="list">
                    <ListHandler<ITask, any, any, ITask, any>
                        queryFn={(params) => fetchTasks(params, location?.id)}
                        initialParams={{
                            _relations: 'assignedTo',
                            sortBy: 'createdAt',
                            sortOrder: 'DESC',
                        }}
                        ListComponent={TaskList}
                        deleteFn={deleteTask}
                        onDeleteSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: [TASKS_STORE_KEY + "-calendar"] });
                            queryClient.invalidateQueries({ queryKey: [TASKS_STORE_KEY + "-list"] });
                        }}
                        dto={TaskListDto}
                        storeKey={TASKS_STORE_KEY}
                        listProps={{}}
                    />
                </TabsContent>
            </Tabs>
        </PageInnerLayout>
    );
}

const Header = () => null;

