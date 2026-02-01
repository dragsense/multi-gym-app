import React, { useMemo, memo } from 'react';
import { useShallow } from 'zustand/shallow';
import { MembersHeader, MembersChartCard, MembersSubscriptionsCard, MembersGrowthCard } from './cards/members';
import { SessionsHeader, RecentSessionCard, StatusOverviewCard } from './cards/sessions';
import { CheckinHeader, PercentageCard, FrequencyCard } from './cards/checkin';
import { RevenueHeader, TotalRevenueCard } from './cards/revenue';
import CompactDashboard from './compact-dashboard';
import { EAnalyticsPeriod } from '@shared/enums';
import type { TSingleHandlerStore } from '@/stores';
import type { ICombinedDashboardData } from '@/services/dashboard.api';
import type { DateRange } from 'react-day-picker';

export interface IExtraProps {
  period: EAnalyticsPeriod;
  customRange?: DateRange;
}

interface IDashboardViewProps {
  storeKey: string;
  store: TSingleHandlerStore<ICombinedDashboardData, IExtraProps>;
}

// Helper functions 
const getDateRange = (period: EAnalyticsPeriod, customRange?: DateRange): { from: Date; to: Date } => {
  const now = new Date();
  let to: Date; let from: Date;
  if (customRange?.from && customRange?.to) {
    to = new Date(customRange.to);
    if (period === EAnalyticsPeriod.MONTH) { from = new Date(customRange.from); from.setMonth(from.getMonth() - 11); from.setDate(1); }
    else if (period === EAnalyticsPeriod.WEEK) { from = new Date(customRange.from); from.setDate(from.getDate() - 14); }
    else if (period === EAnalyticsPeriod.DAY) { from = new Date(customRange.from); from.setDate(from.getDate() - 5); }
    else { from = new Date(customRange.from); }
    return { from, to };
  }
  if (customRange?.from) {
    to = new Date(now); from = new Date(customRange.from);
    if (period === EAnalyticsPeriod.MONTH) { from.setMonth(from.getMonth() - 11); from.setDate(1); }
    else if (period === EAnalyticsPeriod.WEEK) { from.setDate(from.getDate() - 14); }
    else if (period === EAnalyticsPeriod.DAY) { from.setDate(from.getDate() - 5); }
    return { from, to };
  }
  if (customRange?.to) {
    to = new Date(customRange.to);
    if (period === EAnalyticsPeriod.MONTH) { from = new Date(customRange.to); from.setMonth(from.getMonth() - 11); from.setDate(1); }
    else if (period === EAnalyticsPeriod.WEEK) { from = new Date(customRange.to); from.setDate(from.getDate() - 14); }
    else if (period === EAnalyticsPeriod.DAY) { from = new Date(customRange.to); from.setDate(from.getDate() - 5); }
    else { from = new Date(customRange.to.getTime() - 365 * 24 * 60 * 60 * 1000); }
    return { from, to };
  }
  to = new Date(now);
  switch (period) {
    case EAnalyticsPeriod.YEAR: from = new Date(now); from.setFullYear(from.getFullYear() - 5); from.setMonth(0, 1); from.setHours(0, 0, 0, 0); break;
    case EAnalyticsPeriod.MONTH: from = new Date(now); from.setMonth(from.getMonth() - 5); from.setDate(1); from.setHours(0, 0, 0, 0); break;
    case EAnalyticsPeriod.WEEK: from = new Date(now); from.setDate(from.getDate() - 14); from.setHours(0, 0, 0, 0); break;
    case EAnalyticsPeriod.DAY: default: from = new Date(now); from.setDate(from.getDate() - 5); from.setHours(0, 0, 0, 0); break;
  }
  return { from, to };
};

const generatePeriods = (periodType: EAnalyticsPeriod, from: Date, to: Date): string[] => {
  const periods: string[] = [];
  const current = new Date(from);
  const normalizeDate = (date: Date, type: EAnalyticsPeriod): Date => {
    const normalized = new Date(date);
    switch (type) {
      case EAnalyticsPeriod.YEAR: normalized.setUTCMonth(0, 1); normalized.setUTCHours(0, 0, 0, 0); break;
      case EAnalyticsPeriod.MONTH: normalized.setUTCDate(1); normalized.setUTCHours(0, 0, 0, 0); break;
      case EAnalyticsPeriod.WEEK:
        const day = normalized.getUTCDay();
        const diff = normalized.getUTCDate() - day + (day === 0 ? -6 : 1);
        normalized.setUTCDate(diff); normalized.setUTCHours(0, 0, 0, 0); break;
      default: normalized.setUTCHours(0, 0, 0, 0); break;
    }
    return normalized;
  };
  current.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(to);
  endDate.setUTCHours(23, 59, 59, 999);
  const normalizedCurrent = normalizeDate(current, periodType);
  const normalizedEnd = normalizeDate(endDate, periodType);
  while (normalizedCurrent <= normalizedEnd) {
    const year = normalizedCurrent.getUTCFullYear();
    const month = String(normalizedCurrent.getUTCMonth() + 1).padStart(2, '0');
    const day = String(normalizedCurrent.getUTCDate()).padStart(2, '0');
    periods.push(`${year}-${month}-${day}`);
    switch (periodType) {
      case EAnalyticsPeriod.YEAR: normalizedCurrent.setUTCFullYear(normalizedCurrent.getUTCFullYear() + 1); break;
      case EAnalyticsPeriod.MONTH: normalizedCurrent.setUTCMonth(normalizedCurrent.getUTCMonth() + 1); break;
      case EAnalyticsPeriod.WEEK: normalizedCurrent.setUTCDate(normalizedCurrent.getUTCDate() + 7); break;
      default: normalizedCurrent.setUTCDate(normalizedCurrent.getUTCDate() + 1); break;
    }
  }
  return periods;
};

// Pre-compiled regex for date extraction (moved outside function)
const DATE_REGEX = /(\d{4}-\d{2}-\d{2})/;

/**
 * Optimized normalization - extracts YYYY-MM-DD from any period string.
 * Uses pre-compiled regex and avoids Date object creation when possible.
 */
const normalizePeriodToDateStr = (period: any): string => {
  if (!period) return '';
  const periodStr = String(period);
  // Fast path: if already in YYYY-MM-DD format, return as-is
  if (periodStr.length === 10 && periodStr[4] === '-' && periodStr[7] === '-') {
    return periodStr;
  }
  // Try substring check for ISO strings (faster than Regex)
  if (periodStr.length >= 10 && periodStr[4] === '-' && periodStr[7] === '-') {
    return periodStr.substring(0, 10);
  }
  // Fallback to Date parsing
  try {
    const date = new Date(period);
    if (!isNaN(date.getTime())) {
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    }
  } catch { /* ignore */ }
  return periodStr;
};

/**
 * Optimized fillMissingPeriods using pre-generated periods list and Map lookup.
 * Avoids repeated date parsing and regex operations inside loops.
 */
const fillMissingPeriodsOptimized = <T extends { period: string;[key: string]: any }>(
  timeline: T[],
  allPeriods: string[],
  defaultValues: Omit<T, 'period'> = {} as Omit<T, 'period'>
): T[] => {
  if (!timeline || timeline.length === 0) {
    return allPeriods.map(period => ({ period, ...defaultValues } as T));
  }

  // Build lookup map once
  const existingPeriodsMap = new Map<string, T>();
  for (const item of timeline) {
    const normalizedKey = normalizePeriodToDateStr(item.period);
    if (normalizedKey) existingPeriodsMap.set(normalizedKey, item);
  }

  // Get template for missing periods (avoid repeated spreading)
  const template = timeline[0] || defaultValues;
  const baseDefaults = {
    totalSessions: 0, completedSessions: 0, scheduledSessions: 0, cancelledSessions: 0,
    total: 0, sessionRevenue: 0, membershipRevenue: 0, posRevenue: 0, totalMembers: 0, activeMembers: 0,
    ...defaultValues
  };

  return allPeriods.map(period => {
    const existing = existingPeriodsMap.get(period);
    if (existing) return { ...existing, period };
    return { ...(template as any), ...baseDefaults, period } as unknown as T;
  });
};

// sortTimelineByPeriod removed as fillMissingPeriodsOptimized returns sorted data


export const DashboardView: React.FC<IDashboardViewProps> = ({ storeKey, store }) => {
  // Optimized store selector with useShallow - only re-renders when these specific values change
  const { isLoading, data, error, period, customRange } = store(
    useShallow((state) => ({
      isLoading: state.isLoading,
      data: state.response,
      error: state.error,
      period: state.extra.period,
      customRange: state.extra.customRange,
    }))
  );

  // Compute date range and periods ONCE per period/customRange change
  const { dateRange, allPeriods } = useMemo(() => {
    const range = getDateRange(period, customRange);
    const periods = generatePeriods(period, range.from, range.to);
    return { dateRange: range, allPeriods: periods };
  }, [period, customRange?.from?.getTime(), customRange?.to?.getTime()]);

  // Check if we have valid stats data
  const hasValidData = useMemo(() => {
    if (!data) return false;
    let stats = data.stats;
    if (!stats && (data as any).overview) stats = data as any;
    return !!(stats?.overview);
  }, [data]);

  // Members data transformation
  const membersTransformed = useMemo(() => {
    if (!hasValidData || !data) return null;
    let stats = data.stats;
    if (!stats && (data as any).overview) stats = data as any;
    const overview = stats!.overview;
    const membersAnalytics = data.membersAnalytics;
    const membershipsAnalytics = data.membershipsAnalytics;

    const membersStats = {
      total: overview.totalMembers || 0,
      active: overview.totalActiveMembers || 0,
      inactive: (overview.totalMembers || 0) - (overview.totalActiveMembers || 0),
    };

    const rawMembersTimeline = fillMissingPeriodsOptimized(
      membersAnalytics?.timeline?.map((item: any) => ({
        period: item.period,
        totalMembers: item.totalMembers ?? item.total_members ?? 0,
        activeMembers: item.activeMembers ?? item.active_members ?? 0,
        inactiveMembers: item.inactiveMembers ?? item.inactive_members ?? 0,
      })) || [],
      allPeriods,
      { totalMembers: 0, activeMembers: 0, inactiveMembers: 0 }
    );

    // Cumulative totals (ctotal, cActive, cInactive)
    let cT = 0, cA = 0, cI = 0;
    const membersTimeline = rawMembersTimeline.map((item: any) => {
      cT += item.totalMembers; cA += item.activeMembers; cI += item.inactiveMembers;
      return { ...item, totalMembers: cT, activeMembers: cA, inactiveMembers: cI };
    });

    const membershipsTimeline = fillMissingPeriodsOptimized(
      membershipsAnalytics?.timeline?.map((item: any) => ({
        period: item.period, total: item.totalBought ?? item.total_bought ?? 0,
      })) || [],
      allPeriods,
      { total: 0 }
    );

    return {
      members: {
        totals: membersStats,
        series: membersTimeline.map(i => ({ label: i.period, total: i.totalMembers, active: i.activeMembers, inactive: i.inactiveMembers })),
        membershipTypes: membershipsAnalytics?.byType?.map((item: any) => ({ type: item.name || 'Unknown', count: item.count || 0 })) || [],
        growth: membersTimeline.length > 1 ? (membersTimeline[membersTimeline.length - 1].totalMembers - membersTimeline[0].totalMembers) : 0,
        period: period?.toString()
      },
      membershipsGrowth: {
        series: membershipsTimeline.map(i => ({ label: i.period, total: i.total || 0 })),
        period: period?.toString()
      }
    };
  }, [hasValidData, data?.membersAnalytics, data?.membershipsAnalytics, allPeriods, period]);

  // Sessions data transformation
  const sessionsTransformed = useMemo(() => {
    if (!hasValidData || !data) return null;
    let stats = data.stats;
    if (!stats && (data as any).overview) stats = data as any;
    const overview = stats!.overview;
    const sessionsAnalytics = data.sessionsAnalytics;

 
    // Timeline uses startDateTime which includes future scheduled sessions
    const hasTimeline = sessionsAnalytics?.timeline && sessionsAnalytics.timeline.length > 0;
    
    const scheduledTotal = hasTimeline 
      ? sessionsAnalytics.timeline.reduce((sum: number, item: any) => {
          return sum + (item.scheduledSessions ?? item.scheduled_sessions ?? 0);
        }, 0)
      : (overview.activeSessions || 0);
    
    const cancelledTotal = hasTimeline
      ? sessionsAnalytics.timeline.reduce((sum: number, item: any) => {
          return sum + (item.cancelledSessions ?? item.cancelled_sessions ?? 0);
        }, 0)
      : 0;
    
    const completedTotal = hasTimeline
      ? sessionsAnalytics.timeline.reduce((sum: number, item: any) => {
          return sum + (item.completedSessions ?? item.completed_sessions ?? 0);
        }, 0)
      : (overview.completedSessions || 0);
    
    const totalSessionsFromTimeline = hasTimeline
      ? sessionsAnalytics.timeline.reduce((sum: number, item: any) => {
          return sum + (item.totalSessions ?? item.total_sessions ?? 0);
        }, 0)
      : (overview.totalSessions || 0);

    return {
      totals: { 
        total: totalSessionsFromTimeline, 
        scheduled: scheduledTotal, 
        completed: completedTotal, 
        cancelled: cancelledTotal 
      },
      timeline: fillMissingPeriodsOptimized(
        sessionsAnalytics?.timeline?.map((i: any) => ({
          period: i.period,
          totalSessions: i.totalSessions ?? i.total_sessions ?? 0,
          completedSessions: i.completedSessions ?? i.completed_sessions ?? 0,
          scheduledSessions: i.scheduledSessions ?? i.scheduled_sessions ?? 0,
          cancelledSessions: i.cancelledSessions ?? i.cancelled_sessions ?? 0
        })) || [],
        allPeriods,
        { totalSessions: 0, completedSessions: 0, scheduledSessions: 0, cancelledSessions: 0 }
      ),
      period: period?.toString()
    };
  }, [hasValidData, data?.sessionsAnalytics, data?.stats?.overview, allPeriods]);

  // Checkin data transformation
  const checkinTransformed = useMemo(() => {
    if (!hasValidData || !data) return null;
    const checkinsAnalytics = data.checkinsAnalytics;
    const checkinStats = checkinsAnalytics?.checkinStats || { total: 0, attended: 0, missed: 0 };

    return {
      percentage: { attended: checkinStats.attended, missed: checkinStats.missed, percentage: checkinStats.total > 0 ? (checkinStats.attended / checkinStats.total) * 100 : 0 },
      timeline: fillMissingPeriodsOptimized(
        checkinsAnalytics?.timeline || [],
        allPeriods,
        { total: 0, attended: 0, missed: 0 }
      ),
      period: period?.toString()
    };
  }, [hasValidData, data?.checkinsAnalytics, allPeriods]);

  // Revenue data transformation
  const revenueTransformed = useMemo(() => {
    if (!hasValidData || !data) return null;
    const billing = data.billingAnalytics || {};
    const totalRev = billing.revenue?.total || 0;
    let mRev = 0, sRev = 0;
    if (Array.isArray(billing.typeDistribution)) {
      mRev = Number(billing.typeDistribution.find((t: any) => t.type === 'MEMBERSHIP')?.total_amount || 0);
      sRev = Number(billing.typeDistribution.find((t: any) => t.type === 'SESSION')?.total_amount || 0);
    }

    return {
      summary: { totalRevenue: totalRev, fromMemberships: mRev, fromSessions: sRev, fromPOS: totalRev - mRev - sRev },
      timeline: fillMissingPeriodsOptimized(
        billing.timeline?.map((i: any) => ({
          period: i.bucket || i.period, membershipRevenue: i.membershipRevenue || 0, sessionRevenue: i.sessionRevenue || 0, total: i.total || 0
        })) || [],
        allPeriods,
        { membershipRevenue: 0, sessionRevenue: 0, total: 0 }
      ),
      breakdown: [
        { source: 'membership' as const, amount: mRev, percentage: totalRev > 0 ? (mRev / totalRev) * 100 : 0 },
        { source: 'session' as const, amount: sRev, percentage: totalRev > 0 ? (sRev / totalRev) * 100 : 0 }
      ],
      period: period?.toString()
    };
  }, [hasValidData, data?.billingAnalytics, allPeriods]);

  // ERROR STATE
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        Error loading dashboard data: {error.message}
      </div>
    );
  }

  // INITIAL LOADING STATE (Only show when we have zero data)
  if (isLoading && !hasValidData) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-gray-200 rounded-lg" />)}
      </div>
    );
  }

  if (!hasValidData || !membersTransformed || !sessionsTransformed || !checkinTransformed || !revenueTransformed) {
    return <CompactDashboard store={store} />;
  }

  const { members: membersData, membershipsGrowth: membershipsGrowthData } = membersTransformed;
  const sessionsData = sessionsTransformed;
  const checkinData = checkinTransformed;
  const revenueData = revenueTransformed;

  return (
    <div className="space-y-6">

      {/* Subtle loading indicator for background refreshes - no opacity blur */}
      {isLoading && (
        <div className="fixed top-28 right-10 z-50 bg-black/80 text-white px-4 py-1 rounded-full text-xs animate-pulse">
          Refreshing Data...
        </div>
      )}

      <section>
        <MembersHeader data={membersData} isLoading={false} error={error} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <MembersChartCard data={membersData} isLoading={false} error={error} />
          <MembersSubscriptionsCard data={membersData} isLoading={false} error={error} />
          <MembersGrowthCard data={membershipsGrowthData} isLoading={false} error={error} />
        </div>
      </section>

      <section>
        <SessionsHeader data={sessionsData} isLoading={false} error={error} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <RecentSessionCard data={sessionsData} isLoading={false} error={error} />
          <StatusOverviewCard data={sessionsData} isLoading={false} error={error} />
        </div>
      </section>

      <section>
        <CheckinHeader data={checkinData} isLoading={false} error={error} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <PercentageCard data={checkinData} isLoading={false} error={error} />
          <FrequencyCard data={checkinData} isLoading={false} error={error} />
        </div>
      </section>

      <section>
        <RevenueHeader data={revenueData} isLoading={false} error={error} />
        <div className="grid grid-cols-1 gap-4 mt-4">
          <TotalRevenueCard data={revenueData} isLoading={false} error={error} />
        </div>
      </section>
    </div>
  );
};

export default DashboardView;




//dummy data graphs code to be used in order to give update with dummy data

// import React, { useMemo } from 'react';
// import { MembersHeader, MembersChartCard, MembersSubscriptionsCard, MembersGrowthCard } from './cards/members';
// import { SessionsHeader, RecentSessionCard, StatusOverviewCard } from './cards/sessions';
// import { CheckinHeader, PercentageCard, FrequencyCard } from './cards/checkin';
// import { RevenueHeader, TotalRevenueCard } from './cards/revenue';
// import { getAllDummyDashboardData } from './dummy-data';
// import type { DateRange } from 'react-day-picker';
// import { EAnalyticsPeriod } from '@shared/enums';

// export interface IDashboardViewProps {
//   period: EAnalyticsPeriod;
//   customRange?: DateRange;
// }

// export const DashboardView: React.FC<IDashboardViewProps> = ({ period, customRange }) => {
//   // Extract primitive values for stable memoization
//   const fromTime = customRange?.from?.getTime() ?? 0;
//   const toTime = customRange?.to?.getTime() ?? 0;

//   const allDummyData = useMemo(() => {
//     const effectivePeriod = period || EAnalyticsPeriod.MONTH;
//     return getAllDummyDashboardData(effectivePeriod, customRange);
//   }, [period, fromTime, toTime]);

//   const { members, sessions, checkin, revenue } = allDummyData;

//   return (
//     <div className="space-y-6">
//       <section>
//         <MembersHeader data={members} />
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
//           <MembersChartCard data={members}  />
//           <MembersSubscriptionsCard data={members} />
//           <MembersGrowthCard data={members} />
//         </div>
//       </section>
      
//       <section>
//         <SessionsHeader data={sessions} />
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
//           <RecentSessionCard data={sessions} />
//           <StatusOverviewCard data={sessions} />
//         </div>
//       </section>

//       <section>
//         <CheckinHeader data={checkin} />
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
//           <PercentageCard data={checkin} />
//           <FrequencyCard data={checkin} />
//         </div>
//       </section>

//       <section>
//         <RevenueHeader data={revenue} />
//         <div className="grid grid-cols-1 gap-4 mt-4">
//           <TotalRevenueCard data={revenue} />
//         </div>
//       </section>
//     </div>
//   );
// };

// export default DashboardView;



//---------------old code below just for reference no use------------


// import React, { useMemo } from 'react';
// import { MembersHeader, MembersChartCard, MembersSubscriptionsCard, MembersGrowthCard } from './cards/members';
// import { SessionsHeader, RecentSessionCard, StatusOverviewCard } from './cards/sessions';
// import { CheckinHeader, PercentageCard, FrequencyCard } from './cards/checkin';
// import { RevenueHeader, TotalRevenueCard } from './cards/revenue';
// import CompactDashboard from './compact-dashboard';
// import { getAllDummyDashboardData } from './dummy-data';
// import type { ICombinedDashboardData } from '@shared/interfaces/dashboard.interface';
// import type { DateRange } from 'react-day-picker';
// import { EAnalyticsPeriod } from '@shared/enums';
// import type { TSingleHandlerStore } from '@/stores';

// export interface IExtraProps {
//   period: EAnalyticsPeriod;
//   customRange?: DateRange;
// }

// interface IDashboardViewProps {
//   storeKey: string;
//   store: TSingleHandlerStore<ICombinedDashboardData, IExtraProps>;
// }

// export const DashboardView: React.FC<IDashboardViewProps> = ({ storeKey, store }) => {
//   const isLoading = store((state) => state.isLoading);
//   const data = store((state) => state.response);
//   const error = store((state) => state.error);
//   const period = store((state) => state.extra.period);
//   const customRange = store((state) => state.extra.customRange);


//   // Extract primitive values for stable memoization
//   const fromTime = customRange?.from?.getTime() ?? 0;
//   const toTime = customRange?.to?.getTime() ?? 0;

//   const allDummyData = useMemo(() => {
//     // Use MONTH as default if period is not set
//     const effectivePeriod = period || EAnalyticsPeriod.MONTH;
//     return getAllDummyDashboardData(effectivePeriod, customRange);
//   }, [period, fromTime, toTime]);

//   // For now, use dummy data
//   // Extract per-section data from the combined dummy data
//   const membersData = allDummyData.members;
//   const sessionsData = allDummyData.sessions;
//   const checkinData = allDummyData.checkin;
//   const revenueData = allDummyData.revenue;
//   // TODO: Extract other sections when they are added:
//   // const billingData = allDummyData.billing;
//   // const trainersData = allDummyData.trainers;

//   // Only show compact dashboard if we truly have no data at all
//   if (!membersData) {
//     return <CompactDashboard store={store} />;
//   }

//   const componentProps = { data: membersData };

//   return (
//     <div className="space-y-6">
//       <section>
//         <MembersHeader {...componentProps} />

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
//           <MembersChartCard data={membersData}  />
//           <MembersSubscriptionsCard data={membersData} />
//           <MembersGrowthCard data={membersData} />
//         </div>
//       </section>
      
//       {/* Sessions Section */}
//       <section>
//         <SessionsHeader data={sessionsData} />

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
//           <RecentSessionCard data={sessionsData} />
//           <StatusOverviewCard data={sessionsData} />
//         </div>
//       </section>

//       {/* Checkin Section */}
//       <section>
//         <CheckinHeader data={checkinData} />

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
//           <PercentageCard data={checkinData} />
//           <FrequencyCard data={checkinData} />
//         </div>
//       </section>

//       {/* Revenue Section */}
//       <section>
//         <RevenueHeader data={revenueData} />

//         <div className="grid grid-cols-1 gap-4 mt-4">
//           <TotalRevenueCard data={revenueData} />
//         </div>
//       </section>
//     </div>
//   );
// };

// export default DashboardView;
