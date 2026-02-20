import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  IsNotEmpty,
  Min,
  ArrayNotEmpty,
  Matches,
  Max,
  ArrayMinSize,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Expose } from "class-transformer";
import { PartialType } from "../../../lib/dto-type-adapter";
import { PaginationMetaDto } from "../../common/pagination.dto";
import { ListQueryDto } from "../../common/list-query.dto";
import { FieldType, FieldOptions } from "../../../decorators/field.decorator";
import { ESubscriptionStatus, ESubscriptionFrequency, ESubscriptionType, ESubscriptionFeatures } from "../../../enums/business/subscription.enum";
import { Equals } from "../../../decorators/crud.dto.decorators";

export class CreateSubscriptionDto {
  @ApiProperty({
    example: "Premium Plan",
    description: "Subscription title",
  })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    example: "Access to all premium features.",
    description: "Description of the subscription",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea", false)
  description?: string;

  @ApiProperty({
    example: ESubscriptionStatus.ACTIVE,
    enum: ESubscriptionStatus,
    description: "Status of the subscription",
  })
  @IsEnum(ESubscriptionStatus)
  @FieldType("select", true)
  @FieldOptions(
    Object.values(ESubscriptionStatus).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  status: ESubscriptionStatus;

  @ApiProperty({
    example: 0,
    description: 'Sorting order for listing the subscription',
  })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  @Type(() => Number)
  @FieldType("number", false)
  @Min(0)
  sortOrder: number;

  @ApiProperty({
    example: "#3366ff",
    description: "Color code for subscription representation (hex)",
  })
  @IsString()
  @IsNotEmpty()
  @FieldType("color", false)
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'color must be a valid hex color code (e.g., #3B82F6 or #FFF)',
  })
  color: string;

  @ApiProperty({
    example: 99.99,
    description: "Price of the subscription",
  })
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  @Type(() => Number)
  @FieldType("number", true)
  @Min(0.50, { message: "Price must be greater than 0.50" })
  price: number;

  @ApiProperty({
    example: 20,
    description: "Discount percentage for the subscription (0-100)",
  })
  @IsNumber()
  @IsNotEmpty()
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  discountPercentage: number;

  @ApiProperty({
    example: [ESubscriptionFrequency.MONTHLY, ESubscriptionFrequency.YEARLY],
    enum: ESubscriptionFrequency,
    description: "Frequency of subscription renewal",
  })
  @IsNotEmpty()
  @IsArray()
  @IsEnum(ESubscriptionFrequency, { each: true })
  @FieldType("multiSelect", true)
  @FieldOptions(
    Object.values(ESubscriptionFrequency).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  @ArrayMinSize(1, { message: "At least one frequency must be selected" })
  frequency: ESubscriptionFrequency[];

  @ApiProperty({
    example: [ESubscriptionFeatures.TASKS, ESubscriptionFeatures.SESSIONS, ESubscriptionFeatures.ROLES, ESubscriptionFeatures.CHECKINS, ESubscriptionFeatures.ADVERTISEMENTS, ESubscriptionFeatures.CHAT, ESubscriptionFeatures.POS, ESubscriptionFeatures.EQUIPMENT_RESERVATION, ESubscriptionFeatures.LOCATIONS],
    description: "List of module names this subscription grants access to",
    enum: ESubscriptionFeatures,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ESubscriptionFeatures, { each: true })
  @FieldType("multiSelect", false)
  @FieldOptions(
    Object.values(ESubscriptionFeatures).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  features?: ESubscriptionFeatures[];

  @ApiProperty({
    example: true,
    description: 'Should this subscription automatically renew when expired?',
  })
  @IsBoolean()
  @IsNotEmpty()
  @FieldType("switch", true)
  autoRenewal: boolean;


  @ApiProperty({
    example: 10,
    description: 'Trial period in days',
  })
  @IsNumber()
  @IsNotEmpty()
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  @Min(0)
  trialPeriod: number;
}

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) { }

export class SubscriptionDto {
  @ApiProperty({
    example: "92b0e566-d7ad-4b2c-914d-95a823d072bb",
    description: "Subscription ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({
    example: "Premium Plan",
    description: "Subscription title",
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: "Access to all premium features.",
    description: "Description of the subscription",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ESubscriptionStatus.ACTIVE,
    enum: ESubscriptionStatus,
    description: "Status of the subscription",
  })
  @IsEnum(ESubscriptionStatus)
  status: ESubscriptionStatus;

  @ApiProperty({
    example: 1,
    description: "Sort order for listing subscriptions",
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({
    example: "#3366ff",
    description: "Color code for subscription representation (hex)",
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    example: 99.99,
    description: "Price of the subscription",
  })
  @IsNumber()
  @Expose()
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    example: 20,
    description: "Discount percentage for the subscription (0-100)",
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  @Type(() => Number)
  discountPercentage?: number;

  @ApiProperty({
    example: [ESubscriptionFrequency.MONTHLY, ESubscriptionFrequency.YEARLY],
    enum: ESubscriptionFrequency,
    description: "Frequency of subscription renewal",
  })
  @IsArray()
  @IsEnum(ESubscriptionFrequency, { each: true })
  frequency: ESubscriptionFrequency[];

  @ApiProperty({
    example: [ESubscriptionFeatures.TASKS, ESubscriptionFeatures.SESSIONS, ESubscriptionFeatures.ROLES, ESubscriptionFeatures.CHECKINS, ESubscriptionFeatures.ADVERTISEMENTS, ESubscriptionFeatures.CHAT, ESubscriptionFeatures.POS, ESubscriptionFeatures.EQUIPMENT_RESERVATION, ESubscriptionFeatures.LOCATIONS],
    description: "List of features this subscription provides",
    enum: ESubscriptionFeatures,
  })
  @IsArray()
  @IsEnum(ESubscriptionFeatures, { each: true })
  features: ESubscriptionFeatures[];


  @ApiProperty({
    example: true,
    description: "Whether the subscription auto-renews",
  })
  @IsBoolean()
  @IsOptional()
  autoRenewal?: boolean;

  @ApiPropertyOptional({ example: 10, description: "Trial period in days" })
  @IsNumber()
  @IsOptional()
  @Expose()
  @Type(() => Number)
  trialPeriod?: number;

  @ApiPropertyOptional({ example: new Date().toISOString(), description: "Subscription creation date" })
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional({ example: new Date().toISOString(), description: "Subscription update date" })
  @IsOptional()
  updatedAt?: Date;
}

export class SubscriptionListDto extends ListQueryDto<SubscriptionDto> {

  @ApiPropertyOptional({ example: ESubscriptionStatus.ACTIVE, description: "Status of the subscription", enum: ESubscriptionStatus })
  @IsOptional()
  @IsEnum(ESubscriptionStatus)
  @FieldType("select", false)
  @FieldOptions(
    Object.values(ESubscriptionStatus).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  @Equals()
  status?: ESubscriptionStatus;
}

export class SubscriptionPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: [SubscriptionDto] })
  data: SubscriptionDto[];
}
