// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { TQueryParams } from "@shared/types/api/param.type";
import type { ITask, TCreateTaskData, TUpdateTaskData } from "@shared/interfaces/task.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Constants
const TASKS_API_PATH = "/tasks";

// Create base service instance
const taskService = new BaseService<
  ITask,
  TCreateTaskData,
  TUpdateTaskData
>(TASKS_API_PATH);

// Re-export common CRUD operations
export const fetchTasks = (params: IListQueryParams, locationId?: string) =>
  taskService.get<ITask>({...params, filters: { ...(params.filters || {}), locationId }});

export const fetchTask = (id: string, params?: Record<string, any>) =>
  taskService.getSingle<ITask>(id, params);

export const createTask = (data: TCreateTaskData) =>
  taskService.post<IMessageResponse & { task: ITask }>(data);

export const updateTask = (id: string, data: TUpdateTaskData) =>
  taskService.patch<IMessageResponse & { task: ITask }>(id)(data);

export const deleteTask = (id: string) =>
  taskService.delete(id);

export const completeTask = (id: string) =>
  taskService.post<IMessageResponse & { task: ITask }>({}, undefined, `/${id}/complete`);

// Cancel task
export const cancelTask = (id: string, reason?: string) =>
  taskService.patch<{ message: string }>(id)(
    reason ? { reason } : undefined,
    undefined,
    "/cancel"
  );

// Re-export from separate task API files
export * from "./task/task-comments.api";
export * from "./task/task-time-logs.api";
export * from "./task/task-issue-reports.api";
export * from "./task/task-activity-logs.api";

export const fetchOverdueTasks = () =>
  taskService.getAll<ITask>(undefined, "/overdue/all");

export const fetchMyOverdueTasks = () =>
  taskService.getAll<ITask>(undefined, "/overdue/my");

// Calendar events
export const fetchTaskCalendarEvents = (params: TQueryParams) =>
  taskService.getAll<ITask>(params, "/calendar/events");



