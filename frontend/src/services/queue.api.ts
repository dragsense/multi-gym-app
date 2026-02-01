// Utils
import { BaseService } from "./base.service.api";

// Types
import type { QueueMonitorResponse } from "@shared/types/monitor.types";

// Constants
const QUEUE_API_PATH = "/queues";

// Create base service instance
const queueService = new BaseService<any, any, any>(QUEUE_API_PATH);

// Queue monitor operations
export const fetchQueueMonitorUrl = () =>
  queueService.getSingle<QueueMonitorResponse>(null, undefined, "/monitor-url");
