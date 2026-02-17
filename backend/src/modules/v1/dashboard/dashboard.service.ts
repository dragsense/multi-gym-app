
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


  async getDashboardStats(user: User) {
    // Get counts
    const [
      totalMembers,
      totalActiveMembers,
      totalStaff,
      totalActiveStaff,
      totalSessions,
      totalCompletedSessions,
      totalBillings,
      pendingBillings,
      paidBillings
    ] = await Promise.all([
      this.getRelevantRepository<Member>(Member).count(),

      this.getRelevantRepository<Member>(Member)
        .createQueryBuilder('member')
        .innerJoin('member.user', 'user')
        .where('user.isActive = :isActive', { isActive: true })
        .getCount(),

      this.getRelevantRepository<Staff>(Staff).count(),

      this.getRelevantRepository<Staff>(Staff)
        .createQueryBuilder('staff')
        .innerJoin('staff.user', 'user')
        .where('user.isActive = :isActive', { isActive: true })
        .getCount(),

      this.getRelevantRepository<Session>(Session).count(),

      this.getRelevantRepository<Session>(Session)
      .createQueryBuilder('session')
      .where('session.status = :status', { status: ESessionStatus.COMPLETED })
      .getCount(),
  

      this.getRelevantRepository<Billing>(Billing).count(),

      // Get pending billings - latest status from billing_history
      this.getRelevantRepository<Billing>(Billing).query(`
        SELECT COUNT(DISTINCT b.id) as count
        FROM billings b
        LEFT JOIN (
          SELECT "billingId", status
          FROM (
            SELECT "billingId", status,
                   ROW_NUMBER() OVER (PARTITION BY "billingId" ORDER BY "createdAt" DESC) as rn
            FROM billing_history
          ) ranked
          WHERE rn = 1
        ) bh ON b.id = bh."billingId"
        WHERE bh.status = $1
      `, [EBillingStatus.PENDING]).then(result => Number(result[0]?.count || 0)),

      // Get paid billings - latest status from billing_history
      this.getRelevantRepository<Billing>(Billing).query(`
        SELECT COUNT(DISTINCT b.id) as count
        FROM billings b
        LEFT JOIN (
          SELECT "billingId", status
          FROM (
            SELECT "billingId", status,
                   ROW_NUMBER() OVER (PARTITION BY "billingId" ORDER BY "createdAt" DESC) as rn
            FROM billing_history
          ) ranked
          WHERE rn = 1
        ) bh ON b.id = bh."billingId"
        WHERE bh.status = $1
      `, [EBillingStatus.PAID]).then(result => Number(result[0]?.count || 0))
    ]);

    // Calculate completion rates
    const paymentSuccessRate = totalBillings > 0 ? (paidBillings / totalBillings) * 100 : 0;

    return {
      overview: {
        totalMembers,
        totalActiveMembers,
        totalStaff,
        totalActiveStaff,
        totalSessions,
        totalCompletedSessions,
        totalBillings,
        pendingBillings,
        paidBillings
      },
      metrics: {
        paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
      }
    };
  }

  async getSessionsAnalytics(user: User, query: DashboardAnalyticsDto) {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(now.getDate() - 30);
    defaultStart.setHours(0, 0, 0, 0); // Start of day

    let fromDate: Date;
    let toDate: Date;

    if (query?.from) {
      fromDate = new Date(query.from);
      fromDate.setHours(0, 0, 0, 0); // Start of day
    } else {
      fromDate = defaultStart;
    }

    if (query?.to) {
      toDate = new Date(query.to);
      toDate.setHours(23, 59, 59, 999); // End of day to include all billings created on that day
    } else {
      toDate = now;
      toDate.setHours(23, 59, 59, 999); // End of day
    }

    const sessionStatsQuery = `
    SELECT 
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
  `;

    const sessionStats = await this.getRelevantRepository<Session>(Session).query(
      sessionStatsQuery,
      [fromDate, toDate],
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
      [toDate],
    );

    return {
      period: 'custom',
      timeline: sessionStats.map((row) => ({
        period: 'custom',
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



  async getBillingAnalytics(user: User, query?: DashboardAnalyticsDto) {
    // Date range calculation - default to last 30 days
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(now.getDate() - 30);
    defaultStart.setHours(0, 0, 0, 0); // Start of day

    let fromDate: Date;
    let toDate: Date;

    if (query?.from) {
      fromDate = new Date(query.from);
      fromDate.setHours(0, 0, 0, 0); // Start of day
    } else {
      fromDate = defaultStart;
    }

    if (query?.to) {
      toDate = new Date(query.to);
      toDate.setHours(23, 59, 59, 999); // End of day to include all billings created on that day
    } else {
      toDate = now;
      toDate.setHours(23, 59, 59, 999); // End of day
    }

    /** Revenue Stats */
    const revenueStats = await this.getRelevantRepository<Billing>(Billing).query(`
      SELECT
        SUM(b."amount") as total_revenue,
        SUM(CASE WHEN bh.status = 'PAID' THEN b."amount" ELSE 0 END) as paid_revenue,
        SUM(CASE WHEN bh.status = 'PENDING' THEN b."amount" ELSE 0 END) as pending_revenue,
        COUNT(DISTINCT b.id) as total_transactions
      FROM billings b
      LEFT JOIN (
        SELECT "billingId", status
        FROM (
          SELECT "billingId", status,
                 ROW_NUMBER() OVER (PARTITION BY "billingId" ORDER BY "createdAt" DESC) as rn
          FROM billing_history
        ) ranked
        WHERE rn = 1
      ) bh ON b.id = bh."billingId"
      WHERE b."createdAt" >= $1 AND b."createdAt" <= $2
    `, [fromDate, toDate]);

    /** Timeline */
    const timeline = await this.getRelevantRepository<Billing>(Billing).query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', b."createdAt"), 'YYYY-MM') as month,
        SUM(b."amount") as total,
        SUM(CASE WHEN bh.status = 'PAID' THEN b."amount" ELSE 0 END) as paid
      FROM billings b
      LEFT JOIN (
        SELECT "billingId", status
        FROM (
          SELECT "billingId", status,
                 ROW_NUMBER() OVER (PARTITION BY "billingId" ORDER BY "createdAt" DESC) as rn
          FROM billing_history
        ) ranked
        WHERE rn = 1
      ) bh ON b.id = bh."billingId"
      WHERE b."createdAt" >= $1 AND b."createdAt" <= $2
      GROUP BY month
      ORDER BY month ASC
    `, [fromDate, toDate]);

    /** Detailed Summary */
    const summary = await this.getRelevantRepository<Billing>(Billing).query(`
      SELECT
        COUNT(DISTINCT b.id) as total_billings,
        SUM(CASE WHEN bh.status = 'PAID' THEN 1 ELSE 0 END) as paid_billings,
        SUM(CASE WHEN bh.status = 'PENDING' THEN 1 ELSE 0 END) as pending_billings,
        SUM(CASE WHEN bh.status = 'OVERDUE' THEN 1 ELSE 0 END) as overdue_billings,
        SUM(CASE WHEN bh.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_billings,
        SUM(CASE WHEN bh.status = 'FAILED' THEN 1 ELSE 0 END) as failed_billings,
        SUM(CASE WHEN bh.status = 'REFUNDED' THEN 1 ELSE 0 END) as refunded_billings,
        SUM(CASE WHEN bh.status = 'PAID' THEN b."amount" ELSE 0 END) as total_paid,
        SUM(CASE WHEN bh.status = 'PENDING' THEN b."amount" ELSE 0 END) as total_pending,
        SUM(CASE WHEN bh.status = 'OVERDUE' THEN b."amount" ELSE 0 END) as total_overdue,
        SUM(CASE WHEN bh.status = 'CANCELLED' THEN b."amount" ELSE 0 END) as total_cancelled,
        SUM(CASE WHEN bh.status = 'FAILED' THEN b."amount" ELSE 0 END) as total_failed,
        SUM(CASE WHEN bh.status = 'REFUNDED' THEN b."amount" ELSE 0 END) as total_refunded,
        AVG(b."amount") as average_billing_amount,
        AVG(CASE WHEN bh.status = 'PAID' THEN b."amount" END) as average_paid_amount
      FROM billings b
      LEFT JOIN (
        SELECT "billingId", status
        FROM (
          SELECT "billingId", status,
                 ROW_NUMBER() OVER (PARTITION BY "billingId" ORDER BY "createdAt" DESC) as rn
          FROM billing_history
        ) ranked
        WHERE rn = 1
      ) bh ON b.id = bh."billingId"
      WHERE b."createdAt" >= $1 AND b."createdAt" <= $2
    `, [fromDate, toDate]);

    /** Type Distribution */
    const typeDistribution = await this.getRelevantRepository<Billing>(Billing).query(`
      SELECT 
        b."type" as type,
        COUNT(DISTINCT b.id) as count,
        SUM(b."amount") as total_amount,
        SUM(CASE WHEN bh.status = 'PAID' THEN b."amount" ELSE 0 END) as paid_amount,
        AVG(b."amount") as average_amount
      FROM billings b
      LEFT JOIN (
        SELECT "billingId", status
        FROM (
          SELECT "billingId", status,
                 ROW_NUMBER() OVER (PARTITION BY "billingId" ORDER BY "createdAt" DESC) as rn
          FROM billing_history
        ) ranked
        WHERE rn = 1
      ) bh ON b.id = bh."billingId"
      WHERE b."createdAt" >= $1 AND b."createdAt" <= $2
      GROUP BY b."type"
    `, [fromDate, toDate]);

    return {
      period: 'custom',
      revenue: {
        total: Number(revenueStats[0]?.total_revenue || 0),
        paid: Number(revenueStats[0]?.paid_revenue || 0),
        pending: Number(revenueStats[0]?.pending_revenue || 0),
        transactions: Number(revenueStats[0]?.total_transactions || 0)
      },
      timeline: timeline.map(item => ({
        month: item.month,
        total: Number(item.total),
        paid: Number(item.paid),
      })),
      summary: summary[0] || null,
      typeDistribution,
      currencyBreakdown: [],
    };
  }

}
