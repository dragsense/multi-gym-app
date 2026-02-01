// Utils
import { BaseService } from "../base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { ITaskComment, TCreateTaskCommentData, TUpdateTaskCommentData } from "@shared/interfaces/task.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import { CreateTaskCommentDto, UpdateTaskCommentDto, TaskCommentDto } from "@shared/dtos/task-dtos/task-comment.dto";

// Constants
const TASKS_API_PATH = "/tasks";

// Create base service instance
const taskService = new BaseService<
  TaskCommentDto,
  CreateTaskCommentDto,
  UpdateTaskCommentDto
>(TASKS_API_PATH);

// List operations - need taskId
export const fetchTaskComments = (taskId: string) => (params?: IListQueryParams) =>
  taskService.getAll<ITaskComment>(params, `/${taskId}/comments`);

// Single operations
export const fetchTaskComment = (taskId: string) => (commentId: string) =>
  taskService.getSingle<ITaskComment>(commentId, undefined, `/${taskId}/comments`);

export const createTaskComment = (taskId: string) => (data: TCreateTaskCommentData) =>
  taskService.post<IMessageResponse & { comment: ITaskComment }>(
    data,
    undefined,
    `/${taskId}/comments`
  );

// Alias for consistency with other API naming patterns
export const addTaskComment = createTaskComment;

export const updateTaskComment = (taskId: string) => (commentId: string, data: TUpdateTaskCommentData) =>
  taskService.patch<IMessageResponse & { comment: ITaskComment }>(commentId)(
    data,
    undefined,
    `/${taskId}/comments`
  );

export const deleteTaskComment = (taskId: string) => (commentId: string) =>
taskService.delete<void>(commentId, undefined, `/${taskId}/comments`);

