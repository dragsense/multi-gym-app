import { EAnalyticsPeriod } from "../enums/dashboard-analytics.enum";
import { 
  DashboardStatsResponseDto,
  MembersStatsDto,
  MembershipsStatsDto,
  SessionsStatsDto,
  RecentSessionsDto,
  CheckinStatsDto,
  RevenueStatsDto
} from "../dtos/dashboard-dtos/dashboard.dto";


export type IDashboardStats = DashboardStatsResponseDto;
export type IMembersStats = MembersStatsDto;
export type IMembershipsStats = MembershipsStatsDto;
export type ISessionsStats = SessionsStatsDto;
export type IRecentSessions = RecentSessionsDto;
export type ICheckinStats = CheckinStatsDto;
export type IRevenueStats = RevenueStatsDto;

//below are the old interfaces (hard coded) just to keep for reference

// import { EAnalyticsPeriod } from "../enums/dashboard-analytics.enum";

// export interface IDashboardOverview {
//   totalAdmins?: number;
//   totalUsers?: number;
//   totalTrainers?: number;
//   totalClients?: number;
//   totalActiveTrainers?: number;
//   totalActiveClients?: number;
//   totalSessions?: number;
//   totalBillings?: number;
//   activeSessions?: number;
//   pendingBillings?: number;
//   completedSessions?: number;
//   paidBillings?: number;
// }

// export interface IDashboardMetrics {
//   sessionCompletionRate?: number;
//   paymentSuccessRate?: number;
//   averageSessionsPerClient?: number;
// }

// export interface IReferralLinkStats {
//   total: number;
//   active: number;
//   totalReferralCount: number;
//   totalUses: number;
// }

// export interface IDashboardStats {
//   period?: EAnalyticsPeriod;
//   overview: IDashboardOverview;
//   metrics: IDashboardMetrics;
//   referralLinks: IReferralLinkStats;
// }

// export type ICombinedDashboardData = IDashboardStats;

// // Sessions Analytics Types
// export interface ISessionsAnalytics {
//   period?: string;
//   timeline: Array<{
//     period: string;
//     totalSessions: number;
//     completedSessions: number;
//     scheduledSessions: number;
//     cancelledSessions: number;
//     totalPotentialRevenue: number;
//     completionRate: number;
//     averagePrice: number;
//   }>;
//   sessionTypes: Array<{
//     type: string;
//     count: number;
//     averagePrice: number;
//   }>;
// }

// // Billing Analytics Types
// export interface IBillingAnalytics {
//   period?: string;
//   summary: {
//     total_billings: number;
//     paid_billings: number;
//     pending_billings: number;
//     overdue_billings: number;
//     total_paid: number;
//     total_pending: number;
//     total_overdue: number;
//     average_billing_amount: number;
//     average_paid_amount: number;
//   } | null;
//   revenue: {
//     total: number;
//     paid: number;
//     pending: number;
//     platform: number;
//     trainer: number;
//     transactions: number;
//   };
//   timeline: Array<{
//     bucket: string;
//     total: number;
//     paid: number;
//     platformFee: number;
//     trainerPayout: number;
//   }>;
//   typeDistribution: Array<{
//     type: string;
//     total_amount: number;
//     paid_amount: number;
//     average_amount: number;
//     count: number;
//   }>;
// }

// // Checkin Analytics Types
// export interface ICheckinAnalytics {
//   period?: string;
//   percentage: {
//     attended: number;
//     missed: number;
//     percentage: number;
//   };
//   timeline: Array<{
//     period: string;
//     attended: number;
//     missed: number;
//     total: number;
//   }>;
// }

// // Revenue Analytics Types
// export interface IRevenueAnalytics {
//   period?: EAnalyticsPeriod;
//   summary: {
//     totalRevenue: number;
//     fromMemberships: number;
//     fromPOS: number;
//     fromSessions: number;
//     fromSignups: number;
//     fromCustom: number;
//     growthRate?: number;
//     averageRevenuePerMonth?: number;
//   };
//   timeline: Array<{
//     period: string; // e.g., "Jan", "Feb", "2024-01"
//     sessionRevenue: number;
//     membershipRevenue: number;
//     posRevenue: number;
//     signupRevenue: number;
//     customRevenue: number;
//     total: number;
//   }>;
//   breakdown: Array<{
//     source: 'session' | 'membership' | 'pos' | 'signup' | 'custom';
//     amount: number;
//     percentage: number;
//     transactionCount?: number;
//   }>;
// }
