import { IsOptional, IsDateString, IsEnum, IsNumber, IsUUID, IsArray, ValidateNested, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';
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

  @ApiPropertyOptional({ example: EAnalyticsPeriod.MONTH })
  @IsOptional()
  @IsEnum(EAnalyticsPeriod)
  period?: EAnalyticsPeriod;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  locationId?: string;
}

// ============================================
// MEMBERS STATS DTOs
// ============================================
export class MembersStatsDto {
  @ApiProperty({ example: 100, description: 'Total number of members' })
  @IsNumber()
  total: number;

  @ApiProperty({ example: 80, description: 'Number of active members (user.isActive = true)' })
  @IsNumber()
  active: number;

  @ApiProperty({ example: 20, description: 'Number of inactive members (user.isActive = false)' })
  @IsNumber()
  inactive: number;
}

// ============================================
// MEMBERSHIPS STATS DTOs
// ============================================
export class MembershipTypeStatsDto {
  @ApiProperty({ example: 'Premium Plan', description: 'Membership type name from Membership.name' })
  @IsString()
  name: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Membership ID from Membership.id' })
  @IsString()
  membershipId: string;

  @ApiProperty({ example: 25, description: 'Number of MemberMembership records for this membership type' })
  @IsNumber()
  count: number;
}

export class MembershipsStatsDto {
  @ApiProperty({
    type: [MembershipTypeStatsDto],
    description: 'Memberships bought grouped by Membership type (from member_memberships table)'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => MembershipTypeStatsDto)
  byType: MembershipTypeStatsDto[];

  @ApiProperty({ example: 100, description: 'Total memberships bought (count of MemberMembership records)' })
  @IsNumber()
  totalBought: number;
}

// ============================================
// SESSIONS STATS DTOs
// ============================================
export class SessionsStatsDto {
  @ApiProperty({ example: 500, description: 'Total number of sessions' })
  @IsNumber()
  total: number;

  @ApiProperty({ example: 50, description: 'Sessions with status SCHEDULED' })
  @IsNumber()
  scheduled: number;

  @ApiProperty({ example: 10, description: 'Sessions with status IN_PROGRESS' })
  @IsNumber()
  inProgress: number;

  @ApiProperty({ example: 400, description: 'Sessions with status COMPLETED' })
  @IsNumber()
  completed: number;

  @ApiProperty({ example: 20, description: 'Sessions with status CANCELLED' })
  @IsNumber()
  cancelled: number;

  @ApiProperty({ example: 15, description: 'Sessions with status RESCHEDULED' })
  @IsNumber()
  rescheduled: number;
}

export class RecentSessionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Morning Workout' })
  @IsString()
  title: string;

  @ApiProperty({ example: '2024-01-15T09:00:00.000Z' })
  @IsString()
  startDateTime: string;

  @ApiProperty({ enum: ESessionStatus, example: ESessionStatus.COMPLETED })
  @IsEnum(ESessionStatus)
  status: ESessionStatus;

  @ApiProperty({ example: 50.00 })
  @IsNumber()
  price?: number;
}

export class RecentSessionsDto {
  @ApiProperty({
    type: [RecentSessionDto],
    description: 'Recent sessions from Session entity ordered by startDateTime DESC'
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => RecentSessionDto)
  sessions: RecentSessionDto[];
}

// ============================================
// CHECKIN STATS DTOs
// ============================================
export class CheckinStatsDto {
  @ApiProperty({ example: 1000, description: 'Total number of checkins' })
  @IsNumber()
  total: number;

  @ApiProperty({ example: 800, description: 'Checkins with checkOutTime not null (attended)' })
  @IsNumber()
  attended: number;

  @ApiProperty({ example: 200, description: 'Checkins with checkOutTime is null (missed)' })
  @IsNumber()
  missed: number;
}

// ============================================
// REVENUE STATS DTOs
// ============================================
export class RevenueStatsDto {
  @ApiProperty({
    example: 50000.00,
    description: 'Total revenue from all billings (sum of Billing.amount where status = PAID)'
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    example: 20000.00,
    description: 'Revenue from billings with type MEMBERSHIP (Billing.type = MEMBERSHIP)'
  })
  @IsNumber()
  fromMemberships: number;

  @ApiProperty({
    example: 15000.00,
    description: 'Revenue from billings with type MONTHLY/subscriptions (Billing.type = MONTHLY)'
  })
  @IsNumber()
  fromSubscriptions: number;

  @ApiProperty({
    example: 10000.00,
    description: 'Revenue from billings with type SESSION (Billing.type = SESSION)'
  })
  @IsNumber()
  fromSessions: number;

  @ApiProperty({
    example: 5000.00,
    description: 'Revenue from other billing types - PACKAGE, BUSINESS (Billing.type = PACKAGE or BUSINESS)'
  })
  @IsNumber()
  fromOther: number;
}

// ============================================
// MAIN DASHBOARD RESPONSE DTO
// ============================================

export class DashboardOverviewDto {
  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  totalAdmins?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  totalUsers?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  totalTrainers?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  totalActiveTrainers?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  totalMembers?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  totalActiveMembers?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  totalSessions?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  activeSessions?: number;

  @ApiPropertyOptional({ example: 450 })
  @IsOptional()
  @IsNumber()
  completedSessions?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  totalBillings?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  pendingBillings?: number;

  @ApiPropertyOptional({ example: 180 })
  @IsOptional()
  @IsNumber()
  paidBillings?: number;
}

export class DashboardMetricsDto {
  @ApiPropertyOptional({ example: 95.5 })
  @IsOptional()
  @IsNumber()
  sessionCompletionRate?: number;

  @ApiPropertyOptional({ example: 98.2 })
  @IsOptional()
  @IsNumber()
  paymentSuccessRate?: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  averageSessionsPerMember?: number;
}

export class ReferralLinkStatsDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  total: number;

  @ApiProperty({ example: 8 })
  @IsNumber()
  active: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  totalReferralCount: number;

  @ApiProperty({ example: 120 })
  @IsNumber()
  totalUses: number;
}

// ============================================
// MEMBERS ANALYTICS DTOs
// ============================================
export class MembersTimelineItemDto {
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @IsString()
  period: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  totalMembers: number;

  @ApiProperty({ example: 40 })
  @IsNumber()
  activeMembers: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  inactiveMembers: number;
}

export class FitnessLevelDistributionDto {
  @ApiProperty({ example: 'Beginner' })
  @IsString()
  level: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  count: number;
}

export class GoalDistributionDto {
  @ApiProperty({ example: 'Weight Loss' })
  @IsString()
  goal: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  count: number;
}

export class MembersAnalyticsResponseDto {
  @ApiPropertyOptional({ enum: EAnalyticsPeriod })
  @IsOptional()
  @IsEnum(EAnalyticsPeriod)
  period?: EAnalyticsPeriod;

  @ApiProperty({ type: [MembersTimelineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => MembersTimelineItemDto)
  timeline: MembersTimelineItemDto[];

  @ApiProperty({ type: MembersStatsDto })
  @ValidateNested()
  @Expose()
  @Type(() => MembersStatsDto)
  memberStats: MembersStatsDto;

  @ApiProperty({ type: [FitnessLevelDistributionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => FitnessLevelDistributionDto)
  fitnessLevelDistribution: FitnessLevelDistributionDto[];

  @ApiProperty({ type: [GoalDistributionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => GoalDistributionDto)
  goalDistribution: GoalDistributionDto[];
}

// ============================================
// MEMBERSHIPS ANALYTICS DTOs
// ============================================
export class MembershipsTimelineItemDto {
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @IsString()
  period: string;

  @ApiProperty({ example: 30 })
  @IsNumber()
  totalBought: number;

  @ApiProperty({ example: 25 })
  @IsNumber()
  active: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  inactive: number;
}

export class MembershipStatsDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  totalBought: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  active: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  inactive: number;
}

export class MembershipByTypeDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  membershipId: string;

  @ApiProperty({ example: 'Premium Plan' })
  @IsString()
  name: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  count: number;
}

export class BillingFrequencyDistributionDto {
  @ApiProperty({ example: 'MONTHLY' })
  @IsString()
  frequency: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  count: number;
}

export class MembershipsAnalyticsResponseDto {
  @ApiPropertyOptional({ enum: EAnalyticsPeriod })
  @IsOptional()
  @IsEnum(EAnalyticsPeriod)
  period?: EAnalyticsPeriod;

  @ApiProperty({ type: [MembershipsTimelineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => MembershipsTimelineItemDto)
  timeline: MembershipsTimelineItemDto[];

  @ApiProperty({ type: MembershipStatsDto })
  @ValidateNested()
  @Expose()
  @Type(() => MembershipStatsDto)
  membershipStats: MembershipStatsDto;

  @ApiProperty({ type: [MembershipByTypeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => MembershipByTypeDto)
  byType: MembershipByTypeDto[];

  @ApiProperty({ type: [BillingFrequencyDistributionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => BillingFrequencyDistributionDto)
  billingFrequencyDistribution: BillingFrequencyDistributionDto[];
}

// ============================================
// CHECKINS ANALYTICS DTOs
// ============================================
export class CheckinsTimelineItemDto {
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @IsString()
  period: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  total: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  attended: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  missed: number;
}

export class LocationDistributionDto {
  @ApiProperty({ example: 'Main Entrance' })
  @IsString()
  location: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  count: number;
}

export class CheckinsAnalyticsResponseDto {
  @ApiPropertyOptional({ enum: EAnalyticsPeriod })
  @IsOptional()
  @IsEnum(EAnalyticsPeriod)
  period?: EAnalyticsPeriod;

  @ApiProperty({ type: [CheckinsTimelineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => CheckinsTimelineItemDto)
  timeline: CheckinsTimelineItemDto[];

  @ApiProperty({ type: CheckinStatsDto })
  @ValidateNested()
  @Expose()
  @Type(() => CheckinStatsDto)
  checkinStats: CheckinStatsDto;

  @ApiProperty({ type: [LocationDistributionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => LocationDistributionDto)
  locationDistribution: LocationDistributionDto[];

  @ApiProperty({ example: 120.5, description: 'Average duration in minutes' })
  @IsNumber()
  averageDuration: number;
}

// ============================================
// MAIN DASHBOARD RESPONSE DTO
// ============================================
export class DashboardStatsResponseDto {
  @ApiPropertyOptional({ enum: EAnalyticsPeriod })
  @IsOptional()
  @IsEnum(EAnalyticsPeriod)
  period?: EAnalyticsPeriod;

  @ApiProperty({ type: DashboardOverviewDto })
  @ValidateNested()
  @Expose()
  @Type(() => DashboardOverviewDto)
  overview: DashboardOverviewDto;

  @ApiProperty({ type: DashboardMetricsDto })
  @ValidateNested()
  @Expose()
  @Type(() => DashboardMetricsDto)
  metrics: DashboardMetricsDto;

  @ApiProperty({ type: ReferralLinkStatsDto })
  @ValidateNested()
  @Expose()
  @Type(() => ReferralLinkStatsDto)
  referralLinks: ReferralLinkStatsDto;
}