
import { Injectable } from '@nestjs/common';
import { Between, In, Repository } from 'typeorm';
import { User } from '@/common/base-user/entities/user.entity';
import { Session } from '@/modules/v1/sessions/entities/session.entity';
import { Billing } from '@/modules/v1/billings/entities/billing.entity';
import { BillingHistory } from '@/modules/v1/billings/entities/billing-history.entity';
import { ReferralLink } from '@/modules/v1/referral-links/entities/referral-link.entity';
import { Member } from '@/modules/v1/members/entities/member.entity';
import { Checkin } from '@/modules/v1/checkins/entities/checkin.entity';
import { Membership } from '@/modules/v1/memberships/entities/membership.entity';
import { MemberMembership } from '@/modules/v1/memberships/entities/member-membership.entity';

import { EUserLevels } from '@shared/enums';
import { DashboardAnalyticsDto } from '@shared/dtos';
import {
  EAnalyticsPeriod,
  ESessionStatus,
  EBillingStatus,
} from '@shared/enums';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { Staff } from '../staff/entities/staff.entity';

@Injectable()
export class DashboardService {
  constructor(
    private readonly entityRouterService: EntityRouterService,
  ) { }

  private getRelevantRepository<T extends Record<string, any>>(entity: any): Repository<T> {
    return this.entityRouterService.getRepository<T>(entity);
  }


  async getDashboardStats(user: User, query: DashboardAnalyticsDto) {
    const { period, from, to, locationId } = query;
    // Resolve date range
    const start = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    const end = to ? new Date(to) : new Date();

    const dateFilter = { createdAt: Between(start, end) };


    // Build queries based on role
    const [
      totalStaff,
      totalMembers,
      totalActiveStaff,
      totalActiveMembers,
      totalSessions,
      totalBillings,
      activeSessions,
      pendingBillings,
      completedSessions,
      paidBillings,
      totalReferralLinks,
      activeReferralLinks,
      totalReferralCount,
      totalReferralUses,
    ] = await Promise.all([

      // Staff
      this.getRelevantRepository<User>(User).count({
        where: {
          level: EUserLevels.STAFF,
        },
      }),
      // Members
      this.getRelevantRepository<User>(User).count({
        where: {
          level: EUserLevels.MEMBER,
        },
      }),

      // Active Staff
      this.getRelevantRepository<User>(User).count({
        where: {
          level: EUserLevels.STAFF,
          isActive: true,
        },
      }),
      // Active Members
      this.getRelevantRepository<User>(User).count({
        where: {
          level: EUserLevels.MEMBER,
          isActive: true,
        },
      }),

      // Sessions
      this.getRelevantRepository<Session>(Session).count({ where: dateFilter }),
      this.getRelevantRepository<Billing>(Billing).count({ where: dateFilter }),

      // Active Sessions
      this.getRelevantRepository<Session>(Session).count({
        where: { status: ESessionStatus.SCHEDULED, ...dateFilter },
      }),

      this.getRelevantRepository<BillingHistory>(BillingHistory)
        .createQueryBuilder('history')
        .innerJoin('history.billing', 'billing')
        .where('history.status = :status', {
          status: EBillingStatus.PENDING,
        })
        .andWhere('billing."createdAt" BETWEEN :start AND :end', {
          start,
          end,
        })
        .andWhere(
          'history."createdAt" = (SELECT MAX(h2."createdAt") FROM billing_history h2 WHERE h2."billingId" = billing.id)',
        )
        .getCount()
      ,

      // Completed Sessions
      this.getRelevantRepository<Session>(Session).count({
          where: { status: ESessionStatus.COMPLETED, ...dateFilter },
        }),
        

      // Paid Billings (based on latest billing history)
      this.getRelevantRepository<BillingHistory>(BillingHistory)
          .createQueryBuilder('history')
          .innerJoin('history.billing', 'billing')
          .where('history.status = :status', {
            status: EBillingStatus.PAID,
          })
          .andWhere('billing."createdAt" BETWEEN :start AND :end', {
            start,
            end,
          })
          .andWhere(
            'history."createdAt" = (SELECT MAX(h2."createdAt") FROM billing_history h2 WHERE h2."billingId" = billing.id)',
          )
          .getCount()
        ,

      // Referral Links - Total
      this.getRelevantRepository<ReferralLink>(ReferralLink).count({ where: dateFilter }),

      // Referral Links - Active
      this.getRelevantRepository<ReferralLink>(ReferralLink)
          .createQueryBuilder('rl')
          .where('rl.status = :status', { status: 'ACTIVE' })
          .andWhere('rl."createdAt" BETWEEN :start AND :end', { start, end })
          .getCount()
        ,

      // Referral Links - Total Referral Count
        this.getRelevantRepository<ReferralLink>(ReferralLink)
          .createQueryBuilder('rl')
          .select('SUM(rl.referralCount)', 'sum')
          .where('rl."createdAt" BETWEEN :start AND :end', { start, end })
          .getRawOne()
          .then((result) => parseInt(result?.sum || '0', 10))
        ,

      // Referral Links - Total Uses
      this.getRelevantRepository<ReferralLink>(ReferralLink)
          .createQueryBuilder('rl')
          .select('SUM(rl.currentUses)', 'sum')
          .where('rl."createdAt" BETWEEN :start AND :end', { start, end })
          .getRawOne()
          .then((result) => parseInt(result?.sum || '0', 10))
        ,
    ]);

    // Metrics
    const sessionCompletionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const paymentSuccessRate =
      totalBillings > 0 ? (paidBillings / totalBillings) * 100 : 0;

    return {
      period,
      overview: {
          totalStaff,
          totalActiveStaff,
          totalMembers,
          totalActiveMembers,
          totalSessions,
          activeSessions,
          completedSessions,
          totalBillings,
          pendingBillings,
          paidBillings,
      },
      metrics: {
        sessionCompletionRate: Math.round(sessionCompletionRate * 100) / 100,
        paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
        averageSessionsPerMember: Math.round((totalSessions / totalMembers) * 100) / 100,
      },
      referralLinks: {
        total: totalReferralLinks,
        active: activeReferralLinks,
        totalReferralCount,
        totalUses: totalReferralUses,
      },
    };
  }

  async getSessionsAnalytics(user: User, query: DashboardAnalyticsDto) {
    const { period, from, to } = query;

    // Normalize Start Date (Start of the day)
    const start = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    // Normalize End Date (End of the day)
    // FIX: This ensures sessions happening later today are included in the analytics
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);

    let groupBy = `DATE_TRUNC('month', s."startDateTime")`;
    if (period === EAnalyticsPeriod.DAY)
      groupBy = `DATE_TRUNC('day', s."startDateTime")`;
    if (period === EAnalyticsPeriod.WEEK)
      groupBy = `DATE_TRUNC('week', s."startDateTime")`;
    if (period === EAnalyticsPeriod.MONTH)
      groupBy = `DATE_TRUNC('month', s."startDateTime")`;
    if (period === EAnalyticsPeriod.YEAR)
      groupBy = `DATE_TRUNC('year', s."startDateTime")`;

    const sessionStatsQuery = `
    SELECT 
      ${groupBy} as period,
      COUNT(DISTINCT s.id) as total_sessions,
      COUNT(DISTINCT CASE WHEN s.status = 'COMPLETED' THEN s.id END) as completed_sessions,
      COUNT(DISTINCT CASE WHEN s.status = 'SCHEDULED' THEN s.id END) as scheduled_sessions,
      COUNT(DISTINCT CASE WHEN s.status = 'CANCELLED' THEN s.id END) as cancelled_sessions,
      AVG(s.price) as average_price,
      SUM(s.price * COALESCE(member_counts.member_count, 1)) as total_potential_revenue
    FROM sessions s
    LEFT JOIN (
      SELECT "sessionsId", COUNT(*) as member_count 
      FROM session_members_users 
      GROUP BY "sessionsId"
    ) member_counts ON s.id = member_counts."sessionsId"
    WHERE s."startDateTime" BETWEEN $1 AND $2
    GROUP BY ${groupBy}
    ORDER BY period DESC
  `;

    const sessionStats = await this.getRelevantRepository<Session>(Session).query(
      sessionStatsQuery,
      [start, end],
    );

    // Query session types from the last 12 months
    const sessionTypeQuery = `
        SELECT 
          s.type,
          COUNT(*) as count,
          AVG(s.price) as average_price
        FROM sessions s
        WHERE s."startDateTime" BETWEEN ($1::timestamp - INTERVAL '12 months') AND $1
        GROUP BY s.type
        ORDER BY count DESC
      `;

    const sessionTypes = await this.getRelevantRepository<Session>(Session).query(
      sessionTypeQuery,
      [end],
    );

    return {
      period,
      timeline: sessionStats.map((row) => ({
        period: row.period,
        totalSessions: parseInt(row.total_sessions || '0'),
        completedSessions: parseInt(row.completed_sessions || '0'),
        scheduledSessions: parseInt(row.scheduled_sessions || '0'),
        cancelledSessions: parseInt(row.cancelled_sessions || '0'),
        averagePrice: parseFloat(row.average_price) || 0,
        totalPotentialRevenue: parseFloat(row.total_potential_revenue) || 0,
        completionRate:
          parseInt(row.total_sessions) > 0
            ? (parseInt(row.completed_sessions) / parseInt(row.total_sessions)) * 100
            : 0,
      })),
      sessionTypes: sessionTypes.map((row) => ({
        type: row.type,
        count: parseInt(row.count || '0'),
        averagePrice: parseFloat(row.average_price) || 0,
      })),
    };
  }

  async getBillingAnalytics(user: User, query: DashboardAnalyticsDto) {
    const { period, from, to } = query;

    // Normalize Start Date (Start of the day)
    const start = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    // Normalize End Date (End of the day)
    // FIX: This ensures data created later today is included
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);

    const PLATFORM_FEE_PERCENTAGE = 0.02;

    // Build user condition based on role
    let userCondition = '';
    let queryParams: any[] = [start, end];


    // CTE to get the latest status for each billing
    const latestStatusCTE = `
      WITH latest_billing_status AS (
        SELECT DISTINCT ON ("billingId") 
          "billingId",
          status::text as status
        FROM billing_history
        ORDER BY "billingId", "createdAt" DESC
      )
    `;

    /** 2. Revenue Stats */
    const revenueStats = await this.getRelevantRepository<Billing>(Billing).query(
      `
    ${latestStatusCTE}
    SELECT
      SUM(b."amount") as total_revenue,
      SUM(CASE WHEN lbs.status = 'PAID' THEN b."amount" ELSE 0 END) as paid_revenue,
      SUM(CASE WHEN lbs.status = 'PENDING' THEN b."amount" ELSE 0 END) as pending_revenue,
      SUM(CASE WHEN lbs.status = 'PAID' THEN b."amount" * ${PLATFORM_FEE_PERCENTAGE} ELSE 0 END) as platform_revenue,
      COUNT(*) as total_transactions
    FROM billings b
    LEFT JOIN latest_billing_status lbs ON lbs."billingId" = b.id
    WHERE b."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
    `,
      queryParams,
    );

    /** 3. Timeline (dynamic based on period) */
    const groupBy =
      period === EAnalyticsPeriod.YEAR
        ? `DATE_TRUNC('year', b."createdAt")`
        : period === EAnalyticsPeriod.MONTH
          ? `DATE_TRUNC('month', b."createdAt")`
          : period === EAnalyticsPeriod.WEEK
            ? `DATE_TRUNC('week', b."createdAt")`
            : `DATE_TRUNC('day', b."createdAt")`;

    const timeline = await this.getRelevantRepository<Billing>(Billing).query(
      `
   ${latestStatusCTE}
  SELECT 
    TO_CHAR(${groupBy}, 'YYYY-MM-DD') as bucket,
    SUM(b."amount") as total,
    -- ADD THESE THREE LINES:
    SUM(CASE WHEN b."type" = 'MEMBERSHIP' THEN b."amount" ELSE 0 END) as membership_revenue,
    SUM(CASE WHEN b."type" = 'SESSION' THEN b."amount" ELSE 0 END) as session_revenue,
    SUM(CASE WHEN b."type" NOT IN ('MEMBERSHIP', 'SESSION') THEN b."amount" ELSE 0 END) as pos_revenue
  FROM billings b
  LEFT JOIN latest_billing_status lbs ON lbs."billingId" = b.id
  WHERE b."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
  GROUP BY bucket
  ORDER BY bucket ASC
  `,
      queryParams,
    );

    /** 5. Detailed Summary */
    const summary = await this.getRelevantRepository<Billing>(Billing).query(
      `
    ${latestStatusCTE}
    SELECT
      COUNT(*) as total_billings,
      SUM(CASE WHEN lbs.status = 'PAID' THEN 1 ELSE 0 END) as paid_billings,
      SUM(CASE WHEN lbs.status = 'PENDING' THEN 1 ELSE 0 END) as pending_billings,
      SUM(CASE WHEN lbs.status = 'OVERDUE' THEN 1 ELSE 0 END) as overdue_billings,
      SUM(CASE WHEN lbs.status = 'PAID' THEN b."amount" ELSE 0 END) as total_paid,
      SUM(CASE WHEN lbs.status = 'PENDING' THEN b."amount" ELSE 0 END) as total_pending,
      SUM(CASE WHEN lbs.status = 'OVERDUE' THEN b."amount" ELSE 0 END) as total_overdue,
      AVG(b."amount") as average_billing_amount,
      AVG(CASE WHEN lbs.status = 'PAID' THEN b."amount" END) as average_paid_amount
    FROM billings b
    LEFT JOIN latest_billing_status lbs ON lbs."billingId" = b.id
    WHERE b."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
    `,
      queryParams,
    );

    /** 6. Type Distribution */
    const typeDistribution = await this.getRelevantRepository<Billing>(Billing).query(
      `
    ${latestStatusCTE}
    SELECT 
      b."type" as type,
      COUNT(*) as count,
      SUM(b."amount") as total_amount,
      SUM(CASE WHEN lbs.status = 'PAID' THEN b."amount" ELSE 0 END) as paid_amount,
      AVG(b."amount") as average_amount
    FROM billings b
    LEFT JOIN latest_billing_status lbs ON lbs."billingId" = b.id
    WHERE b."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
    GROUP BY b."type"
    `,
      queryParams,
    );

    return {
      period,
      revenue: {
        total: Number(revenueStats[0]?.total_revenue || 0),
        paid: Number(revenueStats[0]?.paid_revenue || 0),
        pending: Number(revenueStats[0]?.pending_revenue || 0),
        platform: Number(revenueStats[0]?.platform_revenue || 0),
        trainer:
          Number(revenueStats[0]?.paid_revenue || 0) -
          Number(revenueStats[0]?.platform_revenue || 0),
        transactions: Number(revenueStats[0]?.total_transactions || 0),
      },
      timeline: timeline.map((item) => ({
        bucket: item.bucket,
        total: Number(item.total),
        // ADD THESE THREE:
        membershipRevenue: Number(item.membership_revenue || 0),
        sessionRevenue: Number(item.session_revenue || 0),
        posRevenue: Number(item.pos_revenue || 0),
      })),
      summary: summary[0] || null,
      typeDistribution,
    };
  }

  async getMembersAnalytics(user: User, query: DashboardAnalyticsDto) {
    const { period, from, to } = query;

    // Normalize Start Date (Start of the day)
    const start = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    // Normalize End Date (End of the day)
    // FIX: This ensures members who join later today are included in today's stats
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);



    // Build user condition based on role
    let userCondition = '';
    let queryParams: any[] = [start, end];


    // Determine groupBy based on period
    let groupBy = `DATE_TRUNC('month', m."createdAt")`;
    if (period === EAnalyticsPeriod.DAY) groupBy = `DATE_TRUNC('day', m."createdAt")`;
    if (period === EAnalyticsPeriod.WEEK) groupBy = `DATE_TRUNC('week', m."createdAt")`;
    if (period === EAnalyticsPeriod.MONTH) groupBy = `DATE_TRUNC('month', m."createdAt")`;
    if (period === EAnalyticsPeriod.YEAR) groupBy = `DATE_TRUNC('year', m."createdAt")`;

    // Timeline query
    const timelineQuery = `
      SELECT 
        ${groupBy} as period,
        COUNT(DISTINCT m.id) as total_members,
        COUNT(DISTINCT CASE WHEN u."isActive" = true THEN m.id END) as active_members,
        COUNT(DISTINCT CASE WHEN u."isActive" = false THEN m.id END) as inactive_members
      FROM members m
      LEFT JOIN users u ON m."userId" = u.id
      WHERE m."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `;

    const timeline = await this.getRelevantRepository<Member>(Member).query(timelineQuery, queryParams);

    // Overall stats
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT m.id) as total,
        COUNT(DISTINCT CASE WHEN u."isActive" = true THEN m.id END) as active,
        COUNT(DISTINCT CASE WHEN u."isActive" = false THEN m.id END) as inactive
      FROM members m
      LEFT JOIN users u ON m."userId" = u.id
      WHERE m."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
    `;

    const stats = await this.getRelevantRepository<Member>(Member).query(statsQuery, queryParams);

    // Fitness level distribution
    const fitnessLevelQuery = `
      SELECT 
        m."fitnessLevel",
        COUNT(*) as count
      FROM members m
      LEFT JOIN users u ON m."userId" = u.id
      WHERE m."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
        AND m."fitnessLevel" IS NOT NULL
      GROUP BY m."fitnessLevel"
      ORDER BY count DESC
    `;

    const fitnessLevelDistribution = await this.getRelevantRepository<Member>(Member).query(fitnessLevelQuery, queryParams);

    // Goal distribution
    const goalQuery = `
      SELECT 
        m.goal,
        COUNT(*) as count
      FROM members m
      LEFT JOIN users u ON m."userId" = u.id
      WHERE m."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
        AND m.goal IS NOT NULL
      GROUP BY m.goal
      ORDER BY count DESC
      LIMIT 10
    `;

    const goalDistribution = await this.getRelevantRepository<Member>(Member).query(goalQuery, queryParams);

    return {
      period,
      timeline: timeline.map((row) => ({
        period: row.period,
        totalMembers: parseInt(row.total_members || '0'),
        activeMembers: parseInt(row.active_members || '0'),
        inactiveMembers: parseInt(row.inactive_members || '0'),
      })),
      memberStats: {
        total: parseInt(stats[0]?.total || '0'),
        active: parseInt(stats[0]?.active || '0'),
        inactive: parseInt(stats[0]?.inactive || '0'),
      },
      fitnessLevelDistribution: fitnessLevelDistribution.map((row) => ({
        level: row.fitnessLevel,
        count: parseInt(row.count || '0'),
      })),
      goalDistribution: goalDistribution.map((row) => ({
        goal: row.goal,
        count: parseInt(row.count || '0'),
      })),
    };
  }

  async getMembershipsAnalytics(user: User, query: DashboardAnalyticsDto) {
    const { period, from, to } = query;

    // Normalize Start Date (Start of the day)
    const start = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    // Normalize End Date (End of the day)
    // FIX: This ensures memberships purchased later today are included
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);

    // Build user condition based on role
    let userCondition = '';
    let queryParams: any[] = [start, end];

    userCondition = `AND mm."memberId" = $3`;
    queryParams.push(user.id);

    // Determine groupBy based on period
    let groupBy = `DATE_TRUNC('month', mm."createdAt")`;
    if (period === EAnalyticsPeriod.DAY) groupBy = `DATE_TRUNC('day', mm."createdAt")`;
    if (period === EAnalyticsPeriod.WEEK) groupBy = `DATE_TRUNC('week', mm."createdAt")`;
    if (period === EAnalyticsPeriod.MONTH) groupBy = `DATE_TRUNC('month', mm."createdAt")`;
    if (period === EAnalyticsPeriod.YEAR) groupBy = `DATE_TRUNC('year', mm."createdAt")`;

    // Timeline query
    const timelineQuery = `
      SELECT 
        ${groupBy} as period,
        COUNT(DISTINCT mm.id) as total_bought,
        COUNT(DISTINCT CASE WHEN mm."isActive" = true THEN mm.id END) as active,
        COUNT(DISTINCT CASE WHEN mm."isActive" = false THEN mm.id END) as inactive
      FROM member_memberships mm
      LEFT JOIN members mem ON mm."memberId" = mem.id
      WHERE mm."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `;

    const timeline = await this.getRelevantRepository<MemberMembership>(MemberMembership).query(timelineQuery, queryParams);

    // Overall stats
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT mm.id) as total_bought,
        COUNT(DISTINCT CASE WHEN mm."isActive" = true THEN mm.id END) as active,
        COUNT(DISTINCT CASE WHEN mm."isActive" = false THEN mm.id END) as inactive
      FROM member_memberships mm
      LEFT JOIN members mem ON mm."memberId" = mem.id
      WHERE mm."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
    `;

    const stats = await this.getRelevantRepository<MemberMembership>(MemberMembership).query(statsQuery, queryParams);

    // By type distribution logic
    const allMembershipsQuery = `
      SELECT m.id as membership_id, m.title as membership_name FROM memberships m
      WHERE m.enabled = true ORDER BY m."sortOrder" ASC, m.title ASC
    `;
    const allMemberships = await this.getRelevantRepository<Membership>(Membership).query(allMembershipsQuery);

    const purchaseCountsQuery = `
      SELECT m.id as membership_id, COUNT(mm.id) as count
      FROM member_memberships mm
      LEFT JOIN memberships m ON mm."membershipId" = m.id
      LEFT JOIN members mem ON mm."memberId" = mem.id
      WHERE mm."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
      GROUP BY m.id
    `;
    const purchaseCounts = await this.getRelevantRepository<MemberMembership>(MemberMembership).query(purchaseCountsQuery, queryParams);

    const countsMap = new Map<string, number>();
    purchaseCounts.forEach((row: any) => {
      countsMap.set(row.membership_id, parseInt(row.count || '0', 10));
    });

    const byType = allMemberships.map((membership: any) => ({
      membershipId: membership.membership_id,
      name: membership.membership_name,
      count: countsMap.get(membership.membership_id) || 0,
    })).sort((a: any, b: any) => b.count - a.count);

    // Billing frequency distribution
    const billingFrequencyQuery = `
      SELECT m."billingFrequency", COUNT(mm.id) as count
      FROM member_memberships mm
      LEFT JOIN memberships m ON mm."membershipId" = m.id
      LEFT JOIN members mem ON mm."memberId" = mem.id
      WHERE mm."createdAt" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
        AND m."billingFrequency" IS NOT NULL
      GROUP BY m."billingFrequency" ORDER BY count DESC
    `;
    const billingFrequencyDistribution = await this.getRelevantRepository<MemberMembership>(MemberMembership).query(billingFrequencyQuery, queryParams);

    return {
      period,
      timeline: timeline.map((row) => ({
        period: row.period,
        totalBought: parseInt(row.total_bought || '0'),
        active: parseInt(row.active || '0'),
        inactive: parseInt(row.inactive || '0'),
      })),
      membershipStats: {
        totalBought: parseInt(stats[0]?.total_bought || '0'),
        active: parseInt(stats[0]?.active || '0'),
        inactive: parseInt(stats[0]?.inactive || '0'),
      },
      byType,
      billingFrequencyDistribution: billingFrequencyDistribution.map((row) => ({
        frequency: row.billingFrequency,
        count: parseInt(row.count || '0'),
      })),
    };
  }

  async getCheckinsAnalytics(user: User, query: DashboardAnalyticsDto) {
    const { period, from, to } = query;
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // FIX 1: Ensure the "end" date covers the entire current day
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);

    // --- 1. CALCULATE EXPECTED CAPACITY (Total Active Members) ---
    // This is the "100%" baseline used to calculate "Missed" automatically
    let memberScopeQuery = this.getRelevantRepository<Member>(Member).createQueryBuilder('m')
      .leftJoin('m.user', 'u')
      .where('u.isActive = true');


    const totalActiveMembers = await memberScopeQuery.getCount();

    // --- 2. BUILD QUERY FILTERS ---
    let userCondition = '';
    let queryParams: any[] = [start, end];

    // --- 3. EXECUTE QUERIES ---
    let groupBy = `DATE_TRUNC('${period === EAnalyticsPeriod.DAY ? 'day' : 'month'}', c."checkInTime")`;

    const timelineQuery = `
    SELECT ${groupBy} as period, COUNT(DISTINCT c."userId") as attended_count
    FROM checkins c
    WHERE c."checkInTime" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
    GROUP BY period ORDER BY period DESC
  `;

    const statsQuery = `
    SELECT COUNT(DISTINCT c."userId") as total_attended,
    AVG(CASE WHEN c."checkOutTime" IS NOT NULL THEN EXTRACT(EPOCH FROM (c."checkOutTime" - c."checkInTime")) / 60 ELSE NULL END) as avg_dur
    FROM checkins c
    WHERE c."checkInTime" BETWEEN $1::timestamp AND $2::timestamp ${userCondition}
  `;

    const [timelineRows, statsRows] = await Promise.all([
      this.getRelevantRepository<Checkin>(Checkin).query(timelineQuery, queryParams),
      this.getRelevantRepository<Checkin>(Checkin).query(statsQuery, queryParams),
    ]);

    const attendedTotal = parseInt(statsRows[0]?.total_attended || '0');

    // --- 4. RETURN FORMATTED DATA ---
    return {
      period,
      timeline: timelineRows.map((row) => {
        const attended = parseInt(row.attended_count || '0');
        return {
          period: row.period,
          total: totalActiveMembers,
          attended: attended,
          // AUTOMATIC MISSED CALCULATION
          missed: Math.max(0, totalActiveMembers - attended),
        };
      }),
      checkinStats: {
        total: totalActiveMembers,
        attended: attendedTotal,
        missed: Math.max(0, totalActiveMembers - attendedTotal),
      },
      averageDuration: parseFloat(statsRows[0]?.avg_dur || '0'),
    };
  }
}
