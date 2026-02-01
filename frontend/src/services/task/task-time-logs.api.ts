// Utils
import { BaseService } from "../base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { ITaskTimeLog, TCreateTaskTimeLogData, TUpdateTaskTimeLogData } from "@shared/interfaces/task.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import { CreateTaskTimeLogDto, TaskTimeLogDto } from "@shared/dtos";

// Constants
const TASKS_API_PATH = "/tasks";

// Create base service instance
const taskService = new BaseService<
  TaskTimeLogDto,
  CreateTaskTimeLogDto,
  TUpdateTaskTimeLogData
>(TASKS_API_PATH);

// List operations - need taskId
export const fetchTaskTimeLogs = (taskId: string) => (params?: IListQueryParams) =>
  taskService.get<ITaskTimeLog>(params, `/${taskId}/time-logs`);

// Single operations
export const fetchTaskTimeLog = (taskId: string) => (timeLogId: string) =>
  taskService.getSingle<ITaskTimeLog>(timeLogId, undefined, `/${taskId}/time-logs`);

export const createTaskTimeLog = (taskId: string) => (data: TCreateTaskTimeLogData) =>
  taskService.post<IMessageResponse & { timeLog: ITaskTimeLog }>(
    data,
    undefined,
    `/${taskId}/time-logs`
  );

// Alias for consistency with other API naming patterns
export const addTaskTimeLog = createTaskTimeLog;

export const updateTaskTimeLog = (taskId: string) => (timeLogId: string, data: TUpdateTaskTimeLogData) =>
  taskService.patch<IMessageResponse & { timeLog: ITaskTimeLog }>(timeLogId)(
    data,
    undefined,
    `/${taskId}/time-logs`
  );

export const deleteTaskTimeLog = (taskId: string) => (timeLogId: string) =>
  taskService.delete<void>(timeLogId, undefined, `/${taskId}/time-logs`);

