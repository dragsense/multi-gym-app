// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IPlatformOwnerDashboardStats } from "@shared/interfaces/platform-owner-dashboard.interface";
import type { PlatformOwnerDashboardDto } from "@shared/dtos";

// Constants
const PLATFORM_OWNER_DASHBOARD_API_PATH = "/platform-owner/dashboard";

// Create base service instance
const platformOwnerDashboardService = new BaseService<
  any,
  Record<string, any>,
  Record<string, any>
>(PLATFORM_OWNER_DASHBOARD_API_PATH);

/**
 * Fetch platform owner dashboard stats
 */
export const fetchPlatformOwnerDashboardStats = (
  params?: Partial<PlatformOwnerDashboardDto>
) => {
  return platformOwnerDashboardService.getSingle<IPlatformOwnerDashboardStats>(
    undefined,
    params,
    "/stats"
  );
};
