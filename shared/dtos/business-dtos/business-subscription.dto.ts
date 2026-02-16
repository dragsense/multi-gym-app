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
import { ESubscriptionStatus, ESubscriptionFrequency } from "../../enums/business/subscription.enum";
import { SubscriptionDto } from "./subscription-dtos";
import { BusinessDto } from "./business.dto";
import { BillingDto } from "../billing-dtos/billing.dto";
import { CreateBusinessDto } from "./business.dto";

export class BusinessSubscriptionDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Business Subscription ID",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Business ID",
  })
  @IsNotEmpty()
  @IsUUID()
  businessId: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440001",
    description: "Subscription ID",
  })
  @IsNotEmpty()
  @IsUUID()
  subscriptionId: string;

  @ApiPropertyOptional({
    type: () => BusinessDto,
    description: "Associated business",
  })
  @IsOptional()
  @Type(() => BusinessDto)
  business?: BusinessDto;

  @ApiPropertyOptional({
    type: () => SubscriptionDto,
    description: "Associated subscription",
  })
  @IsOptional()
  @Type(() => SubscriptionDto)
  subscription?: SubscriptionDto;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

export class BusinessSubscriptionListDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: "Filter by active status",
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class BusinessSubscriptionPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [BusinessSubscriptionDto] })
  @Type(() => BusinessSubscriptionDto)
  data: BusinessSubscriptionDto[];
}

export class BusinessSubscriptionHistoryDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "History ID",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Business Subscription ID",
  })
  @IsNotEmpty()
  @IsUUID()
  businessSubscriptionId: string;

  @ApiProperty({
    example: "ACTIVE",
    description: "Subscription status at this point in time",
    enum: ESubscriptionStatus,
  })
  @IsEnum(ESubscriptionStatus)
  status: ESubscriptionStatus;

  @ApiProperty({
    example: "BUSINESS_SUBSCRIPTION_PAYMENT_INTENT",
    description: "Source of this history event",
  })
  @IsString()
  source: string;

  @ApiPropertyOptional({
    example: "Subscription activated",
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
    description: "Date and time when this subscription status change occurred",
  })
  @IsOptional()
  @IsDateString()
  occurredAt?: Date;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Subscription start date at this point in time",
  })
  @IsDateString()
  startDate: Date;

  @ApiPropertyOptional({
    example: "2024-12-31T23:59:59.999Z",
    description: "Subscription end date at this point in time",
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiPropertyOptional({
    type: () => BusinessSubscriptionDto,
    description: "Associated business subscription",
  })
  @IsOptional()
  @Type(() => BusinessSubscriptionDto)
  businessSubscription?: BusinessSubscriptionDto;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

export class BusinessSubscriptionHistoryListDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: "Filter by status",
    enum: ESubscriptionStatus,
  })
  @IsOptional()
  @IsEnum(ESubscriptionStatus)
  status?: ESubscriptionStatus;
}

export class BusinessSubscriptionHistoryPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [BusinessSubscriptionHistoryDto] })
  @Type(() => BusinessSubscriptionHistoryDto)
  data: BusinessSubscriptionHistoryDto[];
}

export class BusinessSubscriptionBillingDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Business Billing ID",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Business Subscription ID",
  })
  @IsNotEmpty()
  @IsUUID()
  businessSubscriptionId: string;

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
    example: ESubscriptionFrequency.MONTHLY,
    enum: ESubscriptionFrequency,
    description: "Frequency of the subscription",
  })
  @IsOptional()
  @IsEnum(ESubscriptionFrequency)
  selectedFrequency?: ESubscriptionFrequency;

  @ApiPropertyOptional({
    type: () => BusinessSubscriptionDto,
    description: "Associated business",
  })
  @IsOptional()
  @Type(() => BusinessSubscriptionDto)
  businessSubscription?: BusinessSubscriptionDto;

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

export class BusinessSubscriptionBillingListDto extends ListQueryDto {
}

export class BusinessSubscriptionBillingPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [BusinessSubscriptionBillingDto] })
  @Type(() => BusinessSubscriptionBillingDto)
  data: BusinessSubscriptionBillingDto[];
}

export class CurrentBusinessSubscriptionSummaryDto {
  @ApiPropertyOptional({
    example: "ACTIVE",
    description: "Current subscription status",
    enum: ESubscriptionStatus,
  })
  @IsOptional()
  @IsEnum(ESubscriptionStatus)
  status?: ESubscriptionStatus | null;

  @ApiPropertyOptional({
    example: "2024-01-01T00:00:00.000Z",
    description: "Subscription start date",
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date | null;

  @ApiPropertyOptional({
    example: "2024-12-31T23:59:59.999Z",
    description: "Subscription end date",
  })
  @IsOptional()
  @IsDateString()
  endDate?: Date | null;

  @ApiPropertyOptional({
    example: "Premium Plan",
    description: "Subscription name",
  })
  @IsOptional()
  @IsString()
  subscriptionName?: string | null;

  @ApiPropertyOptional({
    example: "Premium subscription with full access",
    description: "Subscription description",
  })
  @IsOptional()
  @IsString()
  subscriptionDescription?: string | null;

  @ApiPropertyOptional({
    example: ESubscriptionFrequency.MONTHLY,
    enum: ESubscriptionFrequency,
    description: "Billing frequency",
  })
  @IsOptional()
  @IsEnum(ESubscriptionFrequency)
  frequency?: ESubscriptionFrequency | null;

  @ApiPropertyOptional({
    example: 99.99,
    description: "Subscription price",
  })
  @IsOptional()
  @IsNumber()
  price?: number | null;

  @ApiPropertyOptional({
    example: "#FF5733",
    description: "Color code for the subscription",
  })
  @IsOptional()
  @IsString()
  color?: string | null;

  @ApiPropertyOptional({
    example: "2024-01-15T09:00:00.000Z",
    description: "Date when subscription was activated",
  })
  @IsOptional()
  @IsDateString()
  activatedAt?: Date | null;
}

export class BusinessSubscriptionStatusDto {
  @ApiPropertyOptional({
    example: "ACTIVE",
    description: "Current subscription status",
    enum: ESubscriptionStatus,
  })
  @IsOptional()
  @IsEnum(ESubscriptionStatus)
  status?: ESubscriptionStatus | null;

  @ApiPropertyOptional({
    example: "2024-01-15T09:00:00.000Z",
    description: "Date when subscription was activated",
  })
  @IsOptional()
  @IsDateString()
  activatedAt?: Date | null;
}

export class CreateBusinessSubscriptionDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Business ID",
  })
  @IsNotEmpty()
  @IsUUID()
  businessId: string;


  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440001",
    description: "Subscription ID",
  })
  @IsNotEmpty()
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({
    example: ESubscriptionFrequency.MONTHLY,
    enum: ESubscriptionFrequency,
    description: "Subscription frequency",
  })
  @IsNotEmpty()
  @IsEnum(ESubscriptionFrequency)
  frequency: ESubscriptionFrequency;
}


export class BusinessSubscriptionPaymentIntentDto {

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Business Subscription ID",
  })
  @IsNotEmpty()
  @IsUUID()
  businessSubscriptionId: string;

  @ApiProperty({
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


export class CreateBusinessSubscriptionPaymentIntentDto extends CreateBusinessSubscriptionDto {

  
  @ApiProperty({
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