// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IDashboardStats } from "@shared/interfaces/dashboard.interface";
import type { DashboardAnalyticsDto } from "@shared/dtos";

// Constants
const DASHBOARD_API_PATH = "/dashboard";

// Create base service instance
const dashboardService = new BaseService<
  any,
  Record<string, any>,
  Record<string, any>
>(DASHBOARD_API_PATH);

/**
 * Combined dashboard data type
 */
export interface ICombinedDashboardData {
  stats: IDashboardStats;
  sessionsAnalytics: any;
  billingAnalytics: any;
  membersAnalytics: any;
  membershipsAnalytics: any;
  checkinsAnalytics: any;
}


/**
 * Fetch dashboard stats only
 */
export const fetchDashboardStats = async (
  params?: Partial<DashboardAnalyticsDto>
): Promise<IDashboardStats> => {
  return dashboardService.getSingle<IDashboardStats>(undefined, params, "/stats");
};

/**
 * Fetch sessions analytics
 */
export const fetchSessionsAnalytics = async (
  params?: Partial<DashboardAnalyticsDto>
): Promise<any> => {
  return dashboardService.getSingle<any>(undefined, params, "/sessions/analytics");
};

/**
 * Fetch billing analytics
 */
export const fetchBillingAnalytics = async (
  params?: Partial<DashboardAnalyticsDto>
): Promise<any> => {
  return dashboardService.getSingle<any>(undefined, params, "/billing/analytics");
};

/**
 * Fetch members analytics
 */
export const fetchMembersAnalytics = async (
  params?: Partial<DashboardAnalyticsDto>
): Promise<any> => {
  return dashboardService.getSingle<any>(undefined, params, "/members/analytics");
};

/**
 * Fetch memberships analytics
 */
export const fetchMembershipsAnalytics = async (
  params?: Partial<DashboardAnalyticsDto>
): Promise<any> => {
  return dashboardService.getSingle<any>(
    undefined,
    params,
    "/memberships/analytics"
  );
};

/**
 * Fetch checkins analytics
 */
export const fetchCheckinsAnalytics = async (
  params?: Partial<DashboardAnalyticsDto>
): Promise<any> => {
  return dashboardService.getSingle<any>(undefined, params, "/checkins/analytics");
};