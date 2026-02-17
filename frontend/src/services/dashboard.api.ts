import { BaseService } from "./base.service.api";
import type { 
  IDashboardStats,
  IBillingAnalytics,
  ICombinedDashboardData,
  ISessionsAnalytics
} from "@/@types/dashboard.type";

const DASHBOARD_API_PATH = "/dashboard";

const dashboardService = new BaseService<any, Record<string, any>, Record<string, any>>(DASHBOARD_API_PATH);


// Dashboard Statistics
export const fetchDashboardStats = (params?: Record<string, any>): Promise<IDashboardStats> =>
  dashboardService.getSingle<IDashboardStats>(undefined, params, "/stats");

// Billing Analytics
export const fetchBillingAnalytics = (params?: {
  from?: string;
  to?: string;
}): Promise<IBillingAnalytics> => {
  return dashboardService.getSingle<IBillingAnalytics>(undefined, params, "/billing/analytics");
};

// Sessions Analytics
export const fetchSessionsAnalytics = (params?: {
  from?: string;
  to?: string;
}): Promise<ISessionsAnalytics> => {
  return dashboardService.getSingle<ISessionsAnalytics>(undefined, params, "/sessions/analytics");
};

// Combined dashboard query function
export const fetchCombinedDashboardData = async (params?: {
  from?: string;
  to?: string;
}): Promise<ICombinedDashboardData> => {
  const [
    stats,
    billingAnalytics,
    sessionsAnalytics
  ] = await Promise.all([
    fetchDashboardStats(),
    fetchBillingAnalytics(params),
    fetchSessionsAnalytics(params)
  ]);

  return {
    stats,
    billingAnalytics,
    sessionsAnalytics
  };
};

// Export dashboard API object for easier imports
export const dashboardApi = {
  getStats: fetchDashboardStats,
  getBillingAnalytics: fetchBillingAnalytics,
  getSessionsAnalytics: fetchSessionsAnalytics,
  getCombinedData: fetchCombinedDashboardData,
};