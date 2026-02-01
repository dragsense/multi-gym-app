// Utils
import { BaseService } from "../base.service.api";

// Types
import type { ITaskActivityLog } from "@shared/interfaces/task.interface";

// Constants
const TASKS_API_PATH = "/tasks";

// Create base service instance
const taskService = new BaseService<any, any, any>(TASKS_API_PATH);

/**
 * Fetch activity logs for a task
 */
export const fetchTaskActivityLogs = (taskId: string) => async (params?: Record<string, any>) => {
  const response = await taskService.getAll<ITaskActivityLog>(params, `/${taskId}/activity-logs`);
  return Array.isArray(response) ? response : [];
};

