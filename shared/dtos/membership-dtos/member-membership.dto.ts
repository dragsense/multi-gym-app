import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsUUID,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto, SingleQueryDto } from "../common/list-query.dto";
import { EMembershipStatus, EBillingFrequency, EPaymentPreference } from "../../enums/membership.enum";
import { MembershipDto } from "./membership.dto";
import { MemberDto } from "../member-dtos/member.dto";
import { BillingDto } from "../billing-dtos/billing.dto";

export class MemberMembershipDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Member Membership ID",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Member ID",
  })
  @IsNotEmpty()
  @IsUUID()
  memberId: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440001",
    description: "Membership ID",
  })
  @IsNotEmpty()
  @IsUUID()
  membershipId: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether the membership is currently active",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: () => MemberDto,
    description: "Associated member",
  })
  @IsOptional()
  @Type(() => MemberDto)
  member?: MemberDto;

  @ApiPropertyOptional({
    type: () => MembershipDto,
    description: "Associated membership",
  })
  @IsOptional()
  @Type(() => MembershipDto)
  membership?: MembershipDto;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

export class MemberMembershipListDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: "Filter by member ID",
  })
  @IsOptional()
  @IsUUID()
  memberId?: string;

  @ApiPropertyOptional({
    description: "Filter by membership ID",
  })
  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @ApiPropertyOptional({
    description: "Filter by active status",
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class MemberMembershipPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [MemberMembershipDto] })
  @Type(() => MemberMembershipDto)
  data: MemberMembershipDto[];
}

export class MemberMembershipHistoryDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "History ID",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Member Membership ID",
  })
  @IsNotEmpty()
  @IsUUID()
  memberMembershipId: string;

  @ApiProperty({
    example: "ACTIVE",
    description: "Membership status at this point in time",
    enum: EMembershipStatus,
  })
  @IsEnum(EMembershipStatus)
  status: EMembershipStatus;

  @ApiProperty({
    example: "MEMBERSHIP_PAYMENT_INTENT",
    description: "Source of this history event",
  })
  @IsString()
  source: string;

  @ApiPropertyOptional({
    example: "Membership activated",
    description: "Optional short description of the event",
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    example: '{"billingId":"uuid","paymentIntentId":"pi_xxx"}',
    description: "Optional extra metadata or error details (JSON)",
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: "2024-01-15T09:00:00.000Z",
    description: "Date and time when this membership status change occurred",
  })
  @IsOptional()
  @IsDateString()
  occurredAt?: Date;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Membership start date at this point in time",
  })
  @IsDateString()
  startDate: Date;

  @ApiPropertyOptional({
    example: "2024-12-31T23:59:59.999Z",
    description: "Membership end date at this point in time",
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiPropertyOptional({
    type: () => MemberMembershipDto,
    description: "Associated member membership",
  })
  @IsOptional()
  @Type(() => MemberMembershipDto)
  memberMembership?: MemberMembershipDto;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

export class MemberMembershipHistoryListDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: "Filter by member membership ID",
  })
  @IsOptional()
  @IsUUID()
  memberMembershipId?: string;

  @ApiPropertyOptional({
    description: "Filter by status",
    enum: EMembershipStatus,
  })
  @IsOptional()
  @IsEnum(EMembershipStatus)
  status?: EMembershipStatus;
}

export class MemberMembershipHistoryPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [MemberMembershipHistoryDto] })
  @Type(() => MemberMembershipHistoryDto)
  data: MemberMembershipHistoryDto[];
}

export class MemberMembershipBillingDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Member Membership Billing ID",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Member Membership ID",
  })
  @IsNotEmpty()
  @IsUUID()
  memberMembershipId: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440001",
    description: "Billing ID",
  })
  @IsNotEmpty()
  @IsUUID()
  billingId: string;

  @ApiPropertyOptional({
    example: "2024-01-15T09:00:00.000Z",
    description: "Date when billing was initiated",
  })
  @IsOptional()
  @IsDateString()
  initiatedAt?: Date;

  @ApiPropertyOptional({
    type: () => MemberMembershipDto,
    description: "Associated member membership",
  })
  @IsOptional()
  @Type(() => MemberMembershipDto)
  memberMembership?: MemberMembershipDto;

  @ApiPropertyOptional({
    type: () => BillingDto,
    description: "Associated billing record",
  })
  @IsOptional()
  @Type(() => BillingDto)
  billing?: BillingDto;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

export class MemberMembershipBillingListDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: "Filter by member membership ID",
  })
  @IsOptional()
  @IsUUID()
  memberMembershipId?: string;

  @ApiPropertyOptional({
    description: "Filter by billing ID",
  })
  @IsOptional()
  @IsUUID()
  billingId?: string;
}

export class MemberMembershipBillingPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [MemberMembershipBillingDto] })
  @Type(() => MemberMembershipBillingDto)
  data: MemberMembershipBillingDto[];
}

export class CurrentMembershipSummaryDto {
  @ApiPropertyOptional({
    example: "ACTIVE",
    description: "Current membership status",
    enum: EMembershipStatus,
  })
  @IsOptional()
  @IsEnum(EMembershipStatus)
  status?: EMembershipStatus | null;

  @ApiPropertyOptional({
    example: "2024-01-01T00:00:00.000Z",
    description: "Membership start date",
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date | null;

  @ApiPropertyOptional({
    example: "2024-12-31T23:59:59.999Z",
    description: "Membership end date",
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date | null;

  @ApiPropertyOptional({
    example: "Premium Plan",
    description: "Membership name",
  })
  @IsOptional()
  @IsString()
  membershipName?: string | null;

  @ApiPropertyOptional({
    example: "Premium membership with full access",
    description: "Membership description",
  })
  @IsOptional()
  @IsString()
  membershipDescription?: string | null;

  @ApiPropertyOptional({
    example: "MONTHLY",
    description: "Billing frequency",
    enum: EBillingFrequency,
  })
  @IsOptional()
  @IsEnum(EBillingFrequency)
  billingFrequency?: EBillingFrequency | null;

  @ApiPropertyOptional({
    example: 99.99,
    description: "Membership price",
  })
  @IsOptional()
  @IsNumber()
  price?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: "Price period in months",
  })
  @IsOptional()
  @IsNumber()
  pricePeriod?: number | null;

  @ApiPropertyOptional({
    example: "#FF5733",
    description: "Color code for the membership",
  })
  @IsOptional()
  @IsString()
  color?: string | null;
}

export class MemberMembershipStatusDto {
  @ApiPropertyOptional({
    example: "ACTIVE",
    description: "Current membership status",
    enum: EMembershipStatus,
  })
  @IsOptional()
  @IsEnum(EMembershipStatus)
  status?: EMembershipStatus | null;

  @ApiPropertyOptional({
    example: "2024-01-15T09:00:00.000Z",
    description: "Date when membership was activated",
  })
  @IsOptional()
  @IsDateString()
  activatedAt?: Date | null;
}

export class MemberMembershipPaymentIntentDto {
  @ApiProperty({ description: "Member Membership ID", example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsUUID()
  @IsNotEmpty()
  memberMembershipId: string;


  @ApiProperty({
    description: "Payment preference (CASH or ONLINE)",
    enum: EPaymentPreference,
    example: EPaymentPreference.ONLINE,
  })
  @IsEnum(EPaymentPreference)
  @IsNotEmpty()
  paymentPreference: EPaymentPreference;

  @ApiPropertyOptional({
    description: "Stripe payment method ID (from frontend) - required for ONLINE payments",
    example: "pm_123",
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: "Save the card for future use",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  saveForFutureUse?: boolean = false;

  @ApiPropertyOptional({
    description: "Set the card as default for invoices",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean = false;
}


export class CreateMemberMembershipPaymentIntentDto {

  @ApiProperty({ description: "Membership ID", example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsUUID()
  @IsNotEmpty()
  membershipId: string;

  @ApiProperty({
    description: "Payment preference (CASH or ONLINE)",
    enum: EPaymentPreference,
    example: EPaymentPreference.ONLINE,
  })
  @IsEnum(EPaymentPreference)
  @IsNotEmpty()
  paymentPreference: EPaymentPreference;

  @ApiPropertyOptional({
    description: "Stripe payment method ID (from frontend) - required for ONLINE payments",
    example: "pm_123",
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: "Save the card for future use",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  saveForFutureUse?: boolean = false;

  @ApiPropertyOptional({
    description: "Set the card as default for invoices",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  setAsDefault?: boolean = false;
}

/**
 * DTO for admin to assign membership to a member with a custom start date
 * This schedules the billing to start from the specified date
 */
export class AdminAssignMembershipDto {
  @ApiProperty({ 
    description: "Member ID to assign membership to", 
    example: "550e8400-e29b-41d4-a716-446655440000" 
  })
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ 
    description: "Membership ID to assign", 
    example: "550e8400-e29b-41d4-a716-446655440001" 
  })
  @IsUUID()
  @IsNotEmpty()
  membershipId: string;

  @ApiProperty({
    description: "Start date for the membership (billing will be scheduled from this date)",
    example: "2026-02-01",
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: "Payment preference (CASH or ONLINE)",
    enum: EPaymentPreference,
    example: EPaymentPreference.CASH,
  })
  @IsEnum(EPaymentPreference)
  @IsNotEmpty()
  paymentPreference: EPaymentPreference;
}