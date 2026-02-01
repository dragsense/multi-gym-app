// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IWorker } from "@shared/interfaces/worker.interface";

// Constants
const WORKER_API_PATH = "/worker";

// Create base service instance
const workerService = new BaseService(WORKER_API_PATH);

// API functions
export const fetchWorkerTasks = (params: IListQueryParams) =>
  workerService.get<IWorker>(params, "/tasks");

export const pauseAllWorkers = () =>
  workerService.post({}, undefined, "/pause-all");

export const resumeAllWorkers = () =>
  workerService.post({}, undefined, "/resume-all");

export const pauseWorker = (taskId: string) =>
  workerService.post({}, undefined, `/pause/${taskId}`);

export const resumeWorker = (taskId: string) =>
  workerService.post({}, undefined, `/resume/${taskId}`);

export const stopWorker = (taskId: string) =>
  workerService.post({}, undefined, `/stop/${taskId}`);
