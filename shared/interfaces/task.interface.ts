import { TaskDto, TaskCommentDto, CreateTaskCommentDto, UpdateTaskCommentDto, CreateTaskDto, UpdateTaskDto, TaskIssueReportDto, CreateTaskIssueReportDto, UpdateTaskIssueReportDto, TaskTimeLogDto, CreateTaskTimeLogDto, UpdateTaskTimeLogDto, TaskActivityLogDto } from '../dtos/task-dtos';

export interface ITask extends TaskDto {}
export interface ITaskComment extends TaskCommentDto {}
export interface ITaskIssueReport extends TaskIssueReportDto {}
export interface ITaskTimeLog extends TaskTimeLogDto {}
export interface ITaskActivityLog extends TaskActivityLogDto {}

export type TCreateTaskData = CreateTaskDto;
export type TUpdateTaskData = UpdateTaskDto;
export type TCreateTaskCommentData = CreateTaskCommentDto;
export type TUpdateTaskCommentData = UpdateTaskCommentDto;

export type TCreateTaskIssueReportData = CreateTaskIssueReportDto;
export type TUpdateTaskIssueReportData = UpdateTaskIssueReportDto;
export type TCreateTaskTimeLogData = CreateTaskTimeLogDto;
export type TUpdateTaskTimeLogData = UpdateTaskTimeLogDto;

