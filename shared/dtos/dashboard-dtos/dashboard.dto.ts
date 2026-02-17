import { IsOptional, IsDateString, IsEnum, IsNumber, IsUUID, IsArray, ValidateNested, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EAnalyticsPeriod } from '../../enums/dashboard-analytics.enum';
import { ESessionStatus } from '../../enums/session.enum';
import { EBillingType } from '../../enums/billing.enum';

// ============================================
// QUERY DTO (for request parameters)
// ============================================
export class DashboardAnalyticsDto {
  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

// ============================================
// DASHBOARD STATS DTOs
// ============================================
export class DashboardOverviewDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  totalMembers: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  totalActiveMembers: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  totalStaff: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  totalActiveStaff: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  totalSessions: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  totalCompletedSessions: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  totalBillings: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  pendingBillings: number;

  @ApiProperty({ example: 180 })
  @IsNumber()
  paidBillings: number;
}

export class DashboardMetricsDto {
  @ApiProperty({ example: 98.2 })
  @IsNumber()
  paymentSuccessRate: number;
}

export class DashboardStatsResponseDto {
  @ApiProperty({ type: DashboardOverviewDto })
  @ValidateNested()
  @Type(() => DashboardOverviewDto)
  overview: DashboardOverviewDto;

  @ApiProperty({ type: DashboardMetricsDto })
  @ValidateNested()
  @Type(() => DashboardMetricsDto)
  metrics: DashboardMetricsDto;
}

// ============================================
// BILLING ANALYTICS DTOs
// ============================================
export class BillingRevenueDto {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  total: number;

  @ApiProperty({ example: 40000 })
  @IsNumber()
  paid: number;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  pending: number;

  @ApiProperty({ example: 200 })
  @IsNumber()
  transactions: number;
}

export class BillingSummaryDto {
  @ApiProperty({ example: 200 })
  @IsNumber()
  total_billings: number;

  @ApiProperty({ example: 180 })
  @IsNumber()
  paid_billings: number;

  @ApiProperty({ example: 15 })
  @IsNumber()
  pending_billings: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  overdue_billings: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  cancelled_billings: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  failed_billings: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  refunded_billings: number;

  @ApiProperty({ example: 4000000 })
  @IsNumber()
  total_paid: number;

  @ApiProperty({ example: 1000000 })
  @IsNumber()
  total_pending: number;

  @ApiProperty({ example: 300000 })
  @IsNumber()
  total_overdue: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  total_cancelled: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  total_failed: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  total_refunded: number;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  average_billing_amount: number;

  @ApiProperty({ example: 22222 })
  @IsNumber()
  average_paid_amount: number;
}

export class BillingTimelineItemDto {
  @ApiProperty({ example: '2024-01' })
  @IsString()
  month: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  total: number;

  @ApiProperty({ example: 40000 })
  @IsNumber()
  paid: number;
}

export class BillingTypeDistributionDto {
  @ApiProperty({ example: 'MEMBERSHIP' })
  @IsString()
  type: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  count: number;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  total_amount: number;

  @ApiProperty({ example: 4000000 })
  @IsNumber()
  paid_amount: number;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  average_amount: number;
}

export class CurrencyBreakdownDto {
  @ApiProperty({ example: 'PKR' })
  @IsString()
  currency: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  total_billings: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  paid_count: number;

  @ApiProperty({ example: 4000000 })
  @IsNumber()
  paid_amount: number;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  total_amount: number;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  average_amount: number;
}

export class BillingAnalyticsResponseDto {
  @ApiProperty({ example: 'month' })
  @IsString()
  period: string;

  @ApiProperty({ type: BillingRevenueDto })
  @ValidateNested()
  @Type(() => BillingRevenueDto)
  revenue: BillingRevenueDto;

  @ApiProperty({ type: [BillingTimelineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillingTimelineItemDto)
  timeline: BillingTimelineItemDto[];

  @ApiProperty({ type: BillingSummaryDto, nullable: true })
  @ValidateNested()
  @Type(() => BillingSummaryDto)
  summary: BillingSummaryDto | null;

  @ApiProperty({ type: [BillingTypeDistributionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillingTypeDistributionDto)
  typeDistribution: BillingTypeDistributionDto[];

  @ApiProperty({ type: [CurrencyBreakdownDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurrencyBreakdownDto)
  currencyBreakdown: CurrencyBreakdownDto[];
}

// ============================================
// SESSIONS ANALYTICS DTOs
// ============================================
export class SessionsTimelineItemDto {
  @ApiProperty({ example: '2024-01' })
  @IsString()
  period: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  totalSessions: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  completedSessions: number;

  @ApiProperty({ example: 15 })
  @IsNumber()
  scheduledSessions: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  cancelledSessions: number;

  @ApiProperty({ example: 500000 })
  @IsNumber()
  totalPotentialRevenue: number;

  @ApiProperty({ example: 80.5 })
  @IsNumber()
  completionRate: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  averagePrice: number;
}

export class SessionTypeDistributionDto {
  @ApiProperty({ example: 'GROUP' })
  @IsString()
  type: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  count: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  averagePrice: number;
}

export class SessionsAnalyticsResponseDto {
  @ApiPropertyOptional({ example: 'month' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiProperty({ type: [SessionsTimelineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionsTimelineItemDto)
  timeline: SessionsTimelineItemDto[];

  @ApiProperty({ type: [SessionTypeDistributionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionTypeDistributionDto)
  sessionTypes: SessionTypeDistributionDto[];
}





// ============================================
// COMBINED DASHBOARD DATA DTO
// ============================================
export class CombinedDashboardDataDto {
  @ApiProperty({ type: DashboardStatsResponseDto })
  @ValidateNested()
  @Type(() => DashboardStatsResponseDto)
  stats: DashboardStatsResponseDto;

  @ApiProperty({ type: SessionsAnalyticsResponseDto, nullable: true })
  @ValidateNested()
  @Type(() => SessionsAnalyticsResponseDto)
  sessionsAnalytics: SessionsAnalyticsResponseDto | null;

  @ApiProperty({ type: BillingAnalyticsResponseDto, nullable: true })
  @ValidateNested()
  @Type(() => BillingAnalyticsResponseDto)
  billingAnalytics: BillingAnalyticsResponseDto | null;
}


