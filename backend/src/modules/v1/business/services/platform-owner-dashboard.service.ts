import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DateTime } from 'luxon';
import { Business } from '../entities/business.entity';
import { BusinessSubscription } from '../entities/business-subscription.entity';
import { BusinessSubscriptionBilling } from '../entities/business-susbscription-billing.entity';
import { BusinessSubscriptionHistory } from '../entities/business-subscription-history.entity';
import { Billing } from '../../billings/entities/billing.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { PlatformOwnerDashboardDto } from '@shared/dtos';
import { IPlatformOwnerDashboardStats } from '@shared/interfaces/platform-owner-dashboard.interface';
import { EBillingStatus } from '@shared/enums';

@Injectable()
export class PlatformOwnerDashboardService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(BusinessSubscription)
    private readonly businessSubscriptionRepository: Repository<BusinessSubscription>,
    @InjectRepository(BusinessSubscriptionBilling)
    private readonly businessSubscriptionBillingRepository: Repository<BusinessSubscriptionBilling>,
  ) {}

  async getDashboardStats(
    query: PlatformOwnerDashboardDto,
    ): Promise<IPlatformOwnerDashboardStats> {
    const { from, to } = query;

    // Resolve date range - default to last 30 days if no dates provided
    const now = DateTime.now();
    const startOfLast30Days = now.minus({ days: 30 }).startOf('day');
    const endOfLast30Days = now.endOf('day');

    // Always default to last 30 days if dates are not provided
    const start = from
      ? DateTime.fromISO(from).startOf('day')
      : startOfLast30Days;
    const end = to 
      ? DateTime.fromISO(to).endOf('day')
      : endOfLast30Days;

    // Convert to JS Date for database queries
    const startDate = start.toJSDate();
    const endDate = end.toJSDate();

    const dateFilter = { createdAt: Between(startDate, endDate) };

    // Get overview stats - all filtered by date range
    const [
      activeBusinesses,
      totalRevenue,
    ] = await Promise.all([
      // Active businesses in the time range - businesses with at least one active subscription created in the range
      this.businessRepository
        .createQueryBuilder('business')
        .innerJoin('business_subscriptions', 'bs', 'bs."businessId" = business.id')
        .where('bs."isActive" = :isActive', { isActive: true })
        .andWhere('bs."createdAt" BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .select('COUNT(DISTINCT business.id)', 'count')
        .getRawOne()
        .then((result) => parseInt(result?.count || '0')),

      // Total revenue from paid subscription billings in the date range
      // Get the latest billing history status for each billing
      this.businessSubscriptionBillingRepository
        .createQueryBuilder('bsb')
        .innerJoin('bsb.billing', 'billing')
        .innerJoin(
          'billing_history',
          'bh',
          'bh."billingId" = billing.id AND bh."createdAt" = (SELECT MAX(bh2."createdAt") FROM billing_history bh2 WHERE bh2."billingId" = billing.id)'
        )
        .where('bh.status = :status', { status: EBillingStatus.PAID })
        .andWhere('billing."createdAt" BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .select('SUM(billing.amount)', 'total')
        .getRawOne()
        .then((result) => parseFloat(result?.total || '0')),
    ]);

    // Get business growth over time - always group by day
    const businessGrowthQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('day', b."createdAt"), 'YYYY-MM-DD') as period,
        COUNT(b.id) as businesses
      FROM businesses b
      WHERE b."createdAt" BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('day', b."createdAt")
      ORDER BY period ASC
    `;

    const businessGrowthData = await this.businessRepository.query(businessGrowthQuery, [
      startDate,
      endDate,
    ]);

    // Get subscription distribution with colors
    const subscriptionDistributionQuery = `
      SELECT 
        s.title as subscription_title,
        s.color as subscription_color,
        COUNT(bs.id) as count,
        COALESCE(SUM(
          CASE 
            WHEN bh.status = 'PAID' THEN billing.amount 
            ELSE 0 
          END
        ), 0) as revenue
      FROM business_subscriptions bs
      INNER JOIN subscriptions s ON s.id = bs."subscriptionId"
      LEFT JOIN business_subscription_billings bsb ON bsb."businessSubscriptionId" = bs.id
      LEFT JOIN billings billing ON billing.id = bsb."billingId"
      LEFT JOIN LATERAL (
        SELECT status 
        FROM billing_history 
        WHERE "billingId" = billing.id 
        ORDER BY "createdAt" DESC 
        LIMIT 1
      ) bh ON true
      WHERE bs."createdAt" BETWEEN $1 AND $2
      GROUP BY s.id, s.title, s.color
      ORDER BY count DESC
    `;

    const subscriptionDistribution = await this.businessSubscriptionRepository.query(
      subscriptionDistributionQuery,
      [startDate, endDate],
    );

    // Determine if dates were provided or defaulted
    const isDefaultDateRange = !from || !to;

    return {
      dateRange: {
        from: start.toISODate() || '',
        to: end.toISODate() || '',
        isDefault: isDefaultDateRange,
      },
      overview: {
        activeBusinesses,
        totalRevenue,
      },
      businessGrowth: businessGrowthData.map((row: any) => ({
        period: row.period,
        businesses: parseInt(row.businesses || '0'),
      })),
      subscriptionDistribution: subscriptionDistribution.map((row: any) => ({
        subscriptionTitle: row.subscription_title,
        count: parseInt(row.count || '0'),
        revenue: parseFloat(row.revenue || '0'),
        color: row.subscription_color || undefined,
      })),
    };
  }
}
