import type { DateRange } from 'react-day-picker';
import { EAnalyticsPeriod } from '@shared/enums';
import type { ISessionsAnalytics, ICheckinAnalytics, IRevenueAnalytics } from '@shared/interfaces/dashboard.interface';

/**
 * Dummy data generator for dashboard sections
 * 
 * This file provides dummy data for dashboard sections when the backend API is not ready.
 * The data automatically changes based on the period and customRange filters from dashboard-controls.
 * 
 * To add a new section (e.g., sessions, billing, trainers):
 * 1. Create a new interface for the section data (e.g., ISessionsData)
 * 2. Create a generator function (e.g., generateDummySessionsData)
 * 3. Add a case in getDummySectionData function
 * 4. In dashboard-view.tsx, call getDummySectionData('sessions', period, customRange)
 * 
 * TODO: Remove this file when backend API is ready
 */

// Simple deterministic random based on index and period
// This ensures consistent data for the same period without complex seeding
function getDeterministicValue(index: number, period: EAnalyticsPeriod, baseValue: number): number {
  const periodSeed = period === EAnalyticsPeriod.DAY ? 1 : period === EAnalyticsPeriod.WEEK ? 2 : period === EAnalyticsPeriod.MONTH ? 3 : 4;
  const combined = (index * 17 + periodSeed * 31 + baseValue) % 100;
  return combined / 100; // Returns 0-1
}

interface IMembersData {
  totals: {
    total: number;
    active: number;
    inactive: number;
  };
  series: Array<{
    label: string;
    total: number;
    active: number;
    inactive: number;
  }>;
  membershipTypes: Array<{
    type: string;
    count: number;
  }>;
  subscriptions: {
    dailyFrequency: number;
  };
}

/**
 * Generate dummy members data based on period
 */
export const generateDummyMembersData = (
  period: EAnalyticsPeriod,
  customRange?: DateRange
): IMembersData => {
  // Ensure we have a valid period (fallback to MONTH if not provided)
  const effectivePeriod = period || EAnalyticsPeriod.MONTH;
  
  // Base values that scale with period
  const getBaseValues = () => {
    switch (effectivePeriod) {
      case EAnalyticsPeriod.DAY:
        // Hourly data for a single day (24 hours)
        return {
          total: 288,
          active: 240,
          inactive: 48,
          seriesCount: 24, // 24 hours
          membershipTypes: [
            { type: 'Basic', count: 120 },
            { type: 'Premium', count: 85 },
            { type: 'Elite', count: 50 },
            { type: 'Corporate', count: 33 },
          ],
        };
      case EAnalyticsPeriod.WEEK:
        // Weekly data showing multiple weeks (last 8 weeks)
        return {
          total: 760,
          active: 640,
          inactive: 120,
          seriesCount: 8, // 8 weeks
          membershipTypes: [
            { type: 'Basic', count: 320 },
            { type: 'Premium', count: 225 },
            { type: 'Elite', count: 135 },
            { type: 'Corporate', count: 80 },
          ],
        };
      case EAnalyticsPeriod.MONTH:
        // Monthly data for a year (12 months)
        return {
          total: 5136,
          active: 4560,
          inactive: 576,
          seriesCount: 12, // 12 months
          membershipTypes: [
            { type: 'Basic', count: 2150 },
            { type: 'Premium', count: 1520 },
            { type: 'Elite', count: 890 },
            { type: 'Corporate', count: 576 },
          ],
        };
      case EAnalyticsPeriod.YEAR:
        // Yearly data showing multiple years (last 5 years)
        return {
          total: 25680,
          active: 23400,
          inactive: 2280,
          seriesCount: 5, // 5 years
          membershipTypes: [
            { type: 'Basic', count: 10750 },
            { type: 'Premium', count: 7600 },
            { type: 'Elite', count: 4450 },
            { type: 'Corporate', count: 2880 },
          ],
        };
      default:
        return {
          total: 760,
          active: 640,
          inactive: 120,
          seriesCount: 8,
          membershipTypes: [
            { type: 'Basic', count: 320 },
            { type: 'Premium', count: 225 },
            { type: 'Elite', count: 135 },
            { type: 'Corporate', count: 80 },
          ],
        };
    }
  };

  const base = getBaseValues();

  // Generate series data
  const generateSeries = () => {
    const series: Array<{ label: string; total: number; active: number; inactive: number }> = [];
    const baseTotal = base.total / base.seriesCount;
    const baseActive = base.active / base.seriesCount;
    const baseInactive = base.inactive / base.seriesCount;

    for (let i = 0; i < base.seriesCount; i++) {
      // Add some variation to make it look realistic (deterministic based on index)
      const variation = (getDeterministicValue(i, effectivePeriod, baseTotal) - 0.5) * 0.2; // ±10% variation
      const total = Math.round(baseTotal * (1 + variation));
      const active = Math.round(baseActive * (1 + variation));
      const inactive = Math.max(0, total - active);

      let label: string;
      switch (effectivePeriod) {
        case EAnalyticsPeriod.DAY:
          // Hourly labels (00:00, 01:00, ..., 23:00)
          label = `${String(i).padStart(2, '0')}:00`;
          break;
        case EAnalyticsPeriod.WEEK:
          // Week labels (Week 1, Week 2, etc.)
          label = `Week ${i + 1}`;
          break;
        case EAnalyticsPeriod.MONTH:
          // Monthly labels (Jan, Feb, Mar, etc.)
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          label = months[i] || `Month ${i + 1}`;
          break;
        case EAnalyticsPeriod.YEAR:
          // Yearly labels (2021, 2022, etc.)
          const currentYear = new Date().getFullYear();
          label = `${currentYear - (base.seriesCount - 1 - i)}`;
          break;
        default:
          label = `Period ${i + 1}`;
      }

      series.push({
        label,
        total,
        active,
        inactive,
      });
    }

    return series;
  };

  return {
    totals: {
      total: base.total,
      active: base.active,
      inactive: base.inactive,
    },
    series: generateSeries(),
    membershipTypes: base.membershipTypes,
    subscriptions: {
      dailyFrequency: effectivePeriod === EAnalyticsPeriod.DAY ? 100 : 85,
    },
  };
};

/**
 * Generate dummy sessions analytics data based on period
 */
export const generateDummySessionsData = (
  period: EAnalyticsPeriod,
  customRange?: DateRange
): ISessionsAnalytics => {
  const effectivePeriod = period || EAnalyticsPeriod.MONTH;
  
  const getBaseValues = () => {
    switch (effectivePeriod) {
      case EAnalyticsPeriod.DAY:
        return { seriesCount: 24 };
      case EAnalyticsPeriod.WEEK:
        return { seriesCount: 7 };
      case EAnalyticsPeriod.MONTH:
        return { seriesCount: 12 };
      case EAnalyticsPeriod.YEAR:
        return { seriesCount: 5 };
      default:
        return { seriesCount: 12 };
    }
  };

  const base = getBaseValues();
  const timeline: ISessionsAnalytics['timeline'] = [];

  for (let i = 0; i < base.seriesCount; i++) {
    const baseValue = 50 + i * 2; // Deterministic base
    const variation = (getDeterministicValue(i, effectivePeriod, baseValue) - 0.5) * 0.2;
    const totalSessions = Math.round((50 + getDeterministicValue(i, effectivePeriod, 30) * 30) * (1 + variation));
    const completedSessions = Math.round(totalSessions * (0.7 + getDeterministicValue(i, effectivePeriod, 20) * 0.2));
    const scheduledSessions = Math.round(totalSessions * (0.15 + getDeterministicValue(i, effectivePeriod, 10) * 0.1));
    const cancelledSessions = Math.max(0, totalSessions - completedSessions - scheduledSessions);
    
    const averagePrice = Math.round((5000 + getDeterministicValue(i, effectivePeriod, 3000) * 3000)); // in cents
    const totalPotentialRevenue = totalSessions * averagePrice;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    let periodLabel: string;
    switch (effectivePeriod) {
      case EAnalyticsPeriod.DAY:
        periodLabel = `${String(i).padStart(2, '0')}:00`;
        break;
      case EAnalyticsPeriod.WEEK:
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        periodLabel = days[i] || `Day ${i + 1}`;
        break;
      case EAnalyticsPeriod.MONTH:
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        periodLabel = months[i] || `Month ${i + 1}`;
        break;
      case EAnalyticsPeriod.YEAR:
        const currentYear = new Date().getFullYear();
        periodLabel = `${currentYear - (base.seriesCount - 1 - i)}`;
        break;
      default:
        periodLabel = `Period ${i + 1}`;
    }

    timeline.push({
      period: periodLabel,
      totalSessions,
      completedSessions,
      scheduledSessions,
      cancelledSessions,
      totalPotentialRevenue,
      completionRate,
      averagePrice,
    });
  }

  const sessionTypes: ISessionsAnalytics['sessionTypes'] = [
    { type: 'Personal Training', count: 45, averagePrice: 7500 },
    { type: 'Group Class', count: 32, averagePrice: 3500 },
    { type: 'Yoga', count: 28, averagePrice: 4000 },
    { type: 'Pilates', count: 15, averagePrice: 4500 },
  ];

  return {
    period: effectivePeriod,
    timeline,
    sessionTypes,
  };
};

/**
 * Generate dummy checkin analytics data based on period
 */
export const generateDummyCheckinData = (
  period: EAnalyticsPeriod,
  customRange?: DateRange
): ICheckinAnalytics => {
  const effectivePeriod = period || EAnalyticsPeriod.WEEK;
  
  const getBaseValues = () => {
    switch (effectivePeriod) {
      case EAnalyticsPeriod.DAY:
        return { seriesCount: 24 };
      case EAnalyticsPeriod.WEEK:
        return { seriesCount: 7 };
      case EAnalyticsPeriod.MONTH:
        return { seriesCount: 12 };
      case EAnalyticsPeriod.YEAR:
        return { seriesCount: 5 };
      default:
        return { seriesCount: 7 };
    }
  };

  const base = getBaseValues();
  const timeline: ICheckinAnalytics['timeline'] = [];
  
  let totalAttended = 0;
  let totalMissed = 0;

  for (let i = 0; i < base.seriesCount; i++) {
    const baseValue = 30 + i;
    const variation = (getDeterministicValue(i, effectivePeriod, baseValue) - 0.5) * 0.2;
    const attended = Math.round((30 + getDeterministicValue(i, effectivePeriod, 20) * 20) * (1 + variation));
    const missed = Math.round((5 + getDeterministicValue(i, effectivePeriod, 10) * 10) * (1 + variation));
    const total = attended + missed;
    
    totalAttended += attended;
    totalMissed += missed;

    let periodLabel: string;
    switch (effectivePeriod) {
      case EAnalyticsPeriod.DAY:
        periodLabel = `${String(i).padStart(2, '0')}:00`;
        break;
      case EAnalyticsPeriod.WEEK:
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        periodLabel = days[i] || `Day ${i + 1}`;
        break;
      case EAnalyticsPeriod.MONTH:
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        periodLabel = months[i] || `Month ${i + 1}`;
        break;
      case EAnalyticsPeriod.YEAR:
        const currentYear = new Date().getFullYear();
        periodLabel = `${currentYear - (base.seriesCount - 1 - i)}`;
        break;
      default:
        periodLabel = `Period ${i + 1}`;
    }

    timeline.push({
      period: periodLabel,
      attended,
      missed,
      total,
    });
  }

  // Calculate overall percentage
  const totalCheckins = totalAttended + totalMissed;
  const percentage = totalCheckins > 0 ? (totalAttended / totalCheckins) * 100 : 0;

  return {
    period: effectivePeriod,
    percentage: {
      attended: totalAttended,
      missed: totalMissed,
      percentage: Math.round(percentage * 100) / 100,
    },
    timeline,
  };
};

/**
 * Generate dummy revenue analytics data based on period
 */
export const generateDummyRevenueData = (
  period: EAnalyticsPeriod,
  customRange?: DateRange
): IRevenueAnalytics => {
  const effectivePeriod = period || EAnalyticsPeriod.MONTH;
  
  const getBaseValues = () => {
    switch (effectivePeriod) {
      case EAnalyticsPeriod.DAY:
        return { 
          seriesCount: 24,
          baseRevenue: 500, // per hour
        };
      case EAnalyticsPeriod.WEEK:
        return { 
          seriesCount: 7,
          baseRevenue: 3000, // per day
        };
      case EAnalyticsPeriod.MONTH:
        return { 
          seriesCount: 12,
          baseRevenue: 25000, // per month
        };
      case EAnalyticsPeriod.YEAR:
        return { 
          seriesCount: 5,
          baseRevenue: 300000, // per year
        };
      default:
        return { 
          seriesCount: 12,
          baseRevenue: 25000,
        };
    }
  };

  const base = getBaseValues();
  const timeline: IRevenueAnalytics['timeline'] = [];
  
  let totalSessionRevenue = 0;
  let totalMembershipRevenue = 0;
  let totalPosRevenue = 0;
  let totalSignupRevenue = 0;
  let totalCustomRevenue = 0;

  for (let i = 0; i < base.seriesCount; i++) {
    const baseValue = base.baseRevenue + i * 100;
    const variation = (getDeterministicValue(i, effectivePeriod, baseValue) - 0.5) * 0.3; // ±15% variation
    
    // Generate revenue for each source with realistic distributions
    const sessionRevenue = Math.round(base.baseRevenue * 0.35 * (1 + variation));
    const membershipRevenue = Math.round(base.baseRevenue * 0.40 * (1 + variation));
    const posRevenue = Math.round(base.baseRevenue * 0.15 * (1 + variation));
    const signupRevenue = Math.round(base.baseRevenue * 0.05 * (1 + variation));
    const customRevenue = Math.round(base.baseRevenue * 0.05 * (1 + variation));
    
    const total = sessionRevenue + membershipRevenue + posRevenue + signupRevenue + customRevenue;
    
    totalSessionRevenue += sessionRevenue;
    totalMembershipRevenue += membershipRevenue;
    totalPosRevenue += posRevenue;
    totalSignupRevenue += signupRevenue;
    totalCustomRevenue += customRevenue;

    let periodLabel: string;
    switch (effectivePeriod) {
      case EAnalyticsPeriod.DAY:
        periodLabel = `${String(i).padStart(2, '0')}:00`;
        break;
      case EAnalyticsPeriod.WEEK:
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        periodLabel = days[i] || `Day ${i + 1}`;
        break;
      case EAnalyticsPeriod.MONTH:
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        periodLabel = months[i] || `Month ${i + 1}`;
        break;
      case EAnalyticsPeriod.YEAR:
        const currentYear = new Date().getFullYear();
        periodLabel = `${currentYear - (base.seriesCount - 1 - i)}`;
        break;
      default:
        periodLabel = `Period ${i + 1}`;
    }

    timeline.push({
      period: periodLabel,
      sessionRevenue,
      membershipRevenue,
      posRevenue,
      signupRevenue,
      customRevenue,
      total,
    });
  }

  const totalRevenue = totalSessionRevenue + totalMembershipRevenue + totalPosRevenue + totalSignupRevenue + totalCustomRevenue;

  // Calculate growth rate (comparing last period to average)
  const lastPeriodRevenue = timeline[timeline.length - 1]?.total || 0;
  const averageRevenue = totalRevenue / timeline.length;
  const growthRate = averageRevenue > 0 ? ((lastPeriodRevenue - averageRevenue) / averageRevenue) * 100 : 0;

  return {
    period: effectivePeriod,
    summary: {
      totalRevenue,
      fromMemberships: totalMembershipRevenue,
      fromPOS: totalPosRevenue,
      fromSessions: totalSessionRevenue,
      fromSignups: totalSignupRevenue,
      fromCustom: totalCustomRevenue,
      growthRate: Math.round(growthRate * 100) / 100,
      averageRevenuePerMonth: Math.round(totalRevenue / timeline.length),
    },
    timeline,
    breakdown: [
      {
        source: 'membership',
        amount: totalMembershipRevenue,
        percentage: (totalMembershipRevenue / totalRevenue) * 100,
        transactionCount: Math.round(timeline.length * 50),
      },
      {
        source: 'session',
        amount: totalSessionRevenue,
        percentage: (totalSessionRevenue / totalRevenue) * 100,
        transactionCount: Math.round(timeline.length * 80),
      },
      {
        source: 'pos',
        amount: totalPosRevenue,
        percentage: (totalPosRevenue / totalRevenue) * 100,
        transactionCount: Math.round(timeline.length * 120),
      },
      {
        source: 'signup',
        amount: totalSignupRevenue,
        percentage: (totalSignupRevenue / totalRevenue) * 100,
        transactionCount: Math.round(timeline.length * 15),
      },
      {
        source: 'custom',
        amount: totalCustomRevenue,
        percentage: (totalCustomRevenue / totalRevenue) * 100,
        transactionCount: Math.round(timeline.length * 10),
      },
    ],
  };
};

/**
 * Interface for all dummy dashboard data
 * This structure allows us to fetch all sections at once
 */
export interface IDummyDashboardData {
  members: IMembersData;
  sessions: ISessionsAnalytics;
  checkin: ICheckinAnalytics;
  revenue: IRevenueAnalytics;
  // TODO: Add other sections when needed
  // billing: IBillingData;
  // trainers: ITrainersData;
}

/**
 * Get all dummy data for all sections at once
 * This is the preferred way to fetch dummy data - fetch everything at once,
 * then extract per-section data as needed
 */
export const getAllDummyDashboardData = (
  period: EAnalyticsPeriod,
  customRange?: DateRange
): IDummyDashboardData => {
  return {
    members: generateDummyMembersData(period, customRange),
    sessions: generateDummySessionsData(period, customRange),
    checkin: generateDummyCheckinData(period, customRange),
    revenue: generateDummyRevenueData(period, customRange),
    // TODO: Add other sections when needed
    // billing: generateDummyBillingData(period, customRange),
    // trainers: generateDummyTrainersData(period, customRange),
  };
};

/**
 * Get dummy data for a specific section
 * This function can be extended for other sections (sessions, billing, etc.)
 * @deprecated Use getAllDummyDashboardData instead and extract the section you need
 */
export const getDummySectionData = (
  section: 'members' | 'sessions' | 'checkin' | 'revenue' | 'billing' | 'trainers',
  period: EAnalyticsPeriod,
  customRange?: DateRange
): any => {
  switch (section) {
    case 'members':
      return generateDummyMembersData(period, customRange);
    case 'sessions':
      return generateDummySessionsData(period, customRange);
    case 'checkin':
      return generateDummyCheckinData(period, customRange);
    case 'revenue':
      return generateDummyRevenueData(period, customRange);
    // TODO: Add other sections when needed
    // case 'billing':
    //   return generateDummyBillingData(period, customRange);
    // case 'trainers':
    //   return generateDummyTrainersData(period, customRange);
    default:
      return null;
  }
};