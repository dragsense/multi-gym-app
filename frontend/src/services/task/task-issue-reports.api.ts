// Utils
import { BaseService } from "../base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { ITaskIssueReport, TCreateTaskIssueReportData, TUpdateTaskIssueReportData } from "@shared/interfaces/task.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import { CreateTaskIssueReportDto, TaskIssueReportDto } from "@shared/dtos";

// Constants
const TASKS_API_PATH = "/tasks";

// Create base service instance
const taskService = new BaseService<
  TaskIssueReportDto,
  CreateTaskIssueReportDto,
  TUpdateTaskIssueReportData
>(TASKS_API_PATH);

// List operations - need taskId
export const fetchTaskIssueReports = (taskId: string) => (params?: IListQueryParams) =>
  taskService.get<ITaskIssueReport>(params, `/${taskId}/issue-reports`);

// Single operations
export const fetchTaskIssueReport = (taskId: string) => (issueReportId: string) =>
  taskService.getSingle<ITaskIssueReport>(issueReportId, undefined, `/${taskId}/issue-reports`);

export const createTaskIssueReport = (taskId: string) => (data: TCreateTaskIssueReportData) =>
  taskService.post<IMessageResponse & { issueReport: ITaskIssueReport }>(
    data,
    undefined,
    `/${taskId}/issue-reports`
  );

// Alias for consistency with other API naming patterns
export const addTaskIssueReport = createTaskIssueReport;

export const updateTaskIssueReport = (taskId: string) => (issueReportId: string, data: TUpdateTaskIssueReportData) =>
  taskService.patch<IMessageResponse & { issueReport: ITaskIssueReport }>(issueReportId)(
    data,
    undefined,
    `/${taskId}/issue-reports`
  );

export const deleteTaskIssueReport = (taskId: string) => (issueReportId: string) =>
  taskService.delete<void>(issueReportId, undefined, `/${taskId}/issue-reports`);

