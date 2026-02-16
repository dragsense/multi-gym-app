// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IHealthStatus } from "@shared/interfaces/health.interface";

// Constants
const HEALTH_API_PATH = "/health";

// Create base service instance
const healthService = new BaseService(HEALTH_API_PATH);

// API functions
export const getHealthStatus = () => healthService.getSingle<IHealthStatus>();
