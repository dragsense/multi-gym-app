import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  Min,
  Max,
  Matches,
  ValidateNested,
  IsArray,
  IsUUID,
  IsDefined,
  ArrayNotEmpty,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OmitType, PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import {
  TransformToBoolean,
  Equals,
} from "../../decorators/crud.dto.decorators";
import {
  EBillingFrequency,
  EPaymentPreference,
  EMembershipExpiry,
} from "../../enums/membership.enum";
import { MembershipSettingsDto } from "./membership-settings.dto";
import { AccessHourDto } from "./access-hour-dtos/access-hour.dto";
import { AccessFeatureDto } from "./access-feature-dtos/access-feature.dto";
import { DoorDto } from "../location-dtos/door.dto";

export class CreateMembershipDto {
  @ApiProperty({ example: "Premium Plan", description: "Membership title" })
  @IsString()
  @IsNotEmpty({message:"Title should not be empty"})
  @FieldType("text", true)
  title: string;

  @ApiProperty({
    example: "Premium membership with full access",
    description: "Membership description",
  })
  @IsString()
  @IsOptional()
  @FieldType("textarea", false)
  description?: string;

  @ApiProperty({
    example: true,
    description: "Whether the membership is enabled",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  enabled?: boolean;

  @ApiProperty({
    example: 1,
    description: "Sort order for display",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  sortOrder?: number;

  @ApiProperty({
    example: "#FF5733",
    description: "Color code for the membership",
  })
  @IsOptional()
  @IsString()
  @FieldType("color", false)
  color?: string;

  @ApiProperty({
    example: 99.99,
    description: "Membership price",
  })
  //@IsOptional()
  @IsDefined({ message: "Price is required" })
  @IsNumber()
  @Min(0)
  @FieldType("number", true)
  @Expose()
  @Type(() => Number)
  price: number;

  @ApiProperty({
    example: 1,
    description: "Price period in months",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  pricePeriod?: number;

  @ApiProperty({
    example: 50.00,
    description: "Signup fee",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  signupFee?: number;

  @ApiProperty({
    example: 100.00,
    description: "Annual fee",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  annualFee?: number;

  @ApiProperty({
    example: 25.00,
    description: "Cancellation fee",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  cancellationFee?: number;

  @ApiProperty({
    example: 10,
    description: "Discount percentage",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  discountPercentage?: number;

  @ApiProperty({
    example: "MONTHLY",
    description: "Billing frequency",
    enum: EBillingFrequency,
  })
  //@IsOptional()
  @IsDefined({ message: "Billing Frequenct is required" })
  @IsEnum(EBillingFrequency)
  @FieldType("select", true)
  @FieldOptions(
    Object.values(EBillingFrequency).map((v) => ({
      value: v,
      label: v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
    }))
  )
  billingFrequency: EBillingFrequency;

  @ApiProperty({
    example: "AFTER_1_YEAR",
    description: "Membership expiry period",
    enum: EMembershipExpiry,
  })
  //@IsOptional()
  @IsDefined({ message: "Expiry is required" })
  @IsEnum(EMembershipExpiry)
  @FieldType("select", true)
  @FieldOptions(
    Object.values(EMembershipExpiry).map((v) => ({
      value: v,
      label: v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
    }))
  )
  expiry: EMembershipExpiry;

  @ApiProperty({
    example: ["CASH", "ONLINE"],
    description: "Payment preferences (multiple)",
    enum: EPaymentPreference,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(EPaymentPreference, { each: true })
  @FieldType("multiSelect", false)
  @FieldOptions(
    Object.values(EPaymentPreference).map((v) => ({
      value: v,
      label: v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
    }))
  )
  paymentPreference?: EPaymentPreference[] = [EPaymentPreference.CASH];

  @ApiProperty({
    example: 1,
    description: "Billing start day (1-31)",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  billingStartDay?: number;

  @ApiProperty({
    example: true,
    description: "Whether to prorate charges",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  prorate?: boolean;

  @ApiProperty({
    example: "15-03",
    description: "Annual fee date in DD-MM format",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}-\d{2}$/, {
    message: "Annual fee date must be in DD-MM format",
  })
  @FieldType("text", false)
  annualFeeDate?: string;

  @ApiProperty({
    type: MembershipSettingsDto,
    description: "Additional settings",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => MembershipSettingsDto)
  @FieldType("nested", false, MembershipSettingsDto)
  settings?: MembershipSettingsDto;

  @ApiProperty({
    type: [AccessHourDto],
    description: "Associated access hours",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => AccessHourDto)
  @FieldType("nestedArray", false, AccessHourDto)
  accessHours?: AccessHourDto[];

  @ApiProperty({
    type: [AccessFeatureDto],
    description: "Associated access features",
  })
  //@IsOptional()
  @IsArray({ message: "Access Features must be an array" })
  @ArrayNotEmpty({ message: "At least one access feature is required" })
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => AccessFeatureDto)
  @FieldType("nestedArray", true, AccessFeatureDto)
  accessFeatures: AccessFeatureDto[];

  @ApiPropertyOptional({
    example: "Terms and conditions for this membership",
    description: "Terms and conditions in HTML format",
  })
  @IsOptional()
  @IsString()
  @FieldType("quill", false)
  termsAndConditions?: string;

  @ApiPropertyOptional({
    type: [DoorDto],
    description: "Doors associated with this membership",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => DoorDto)
  @FieldType("nestedArray", false, DoorDto)
  doors?: DoorDto[];
}

export class UpdateMembershipDto extends PartialType(CreateMembershipDto) {}

export class MembershipListDto extends ListQueryDto {
  @ApiPropertyOptional({
    example: true,
    description: "Filter by enabled status",
  })
  @IsOptional()
  @IsBoolean()
  @Equals()
  @FieldType("select", false)
  @FieldOptions([
    { value: "true", label: "Yes" },
    { value: "false", label: "No" },
  ])
  @TransformToBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    example: "MONTHLY",
    description: "Filter by billing frequency",
  })
  @IsOptional()
  @IsEnum(EBillingFrequency)
  @FieldType("select", false)
  @FieldOptions(
    Object.values(EBillingFrequency).map((v) => ({
      value: v,
      label: v.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
    }))
  )
  billingFrequency?: EBillingFrequency;
}

export class MembershipPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [MembershipDto] })
  @Expose()
  @Type(() => MembershipDto)
  data: MembershipDto[];
}

export class MembershipDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Membership ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({ example: "Premium Plan", description: "Membership title" })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({
    example: "Premium membership with full access",
    description: "Membership description",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: true,
    description: "Whether the membership is enabled",
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({
    example: 1,
    description: "Sort order for display",
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiProperty({
    example: "#FF5733",
    description: "Color code for the membership",
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    example: 99.99,
    description: "Membership price",
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    example: 1,
    description: "Price period in months",
  })
  @IsOptional()
  @IsNumber()
  pricePeriod?: number;

  @ApiProperty({
    example: 99.99,
    description: "Calculated price",
  })
  @IsOptional()
  @IsNumber()
  calculatedPrice?: number;

  @ApiProperty({
    example: 50.00,
    description: "Signup fee",
  })
  @IsOptional()
  @IsNumber()
  signupFee?: number;

  @ApiProperty({
    example: 100.00,
    description: "Annual fee",
  })
  @IsOptional()
  @IsNumber()
  annualFee?: number;

  @ApiProperty({
    example: 25.00,
    description: "Cancellation fee",
  })
  @IsOptional()
  @IsNumber()
  cancellationFee?: number;

  @ApiProperty({
    example: 10,
    description: "Discount percentage",
  })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiProperty({
    example: "MONTHLY",
    description: "Billing frequency",
    enum: EBillingFrequency,
  })
  @IsOptional()
  billingFrequency?: EBillingFrequency;

  @ApiProperty({
    example: "AFTER_1_YEAR",
    description: "Membership expiry period",
    enum: EMembershipExpiry,
  })
  @IsOptional()
  expiry?: EMembershipExpiry;

  @ApiProperty({
    example: ["CASH", "ONLINE"],
    description: "Payment preferences (multiple)",
    enum: EPaymentPreference,
    isArray: true,
  })
  @IsOptional()
  paymentPreference?: EPaymentPreference[];

  @ApiProperty({
    example: 1,
    description: "Billing start day (1-31)",
  })
  @IsOptional()
  @IsNumber()
  billingStartDay?: number;

  @ApiProperty({
    example: true,
    description: "Whether to prorate charges",
  })
  @IsOptional()
  @IsBoolean()
  prorate?: boolean;

  @ApiProperty({
    example: "15-03",
    description: "Annual fee date in DD-MM format",
  })
  @IsOptional()
  @IsString()
  annualFeeDate?: string;

  @ApiProperty({
    type: MembershipSettingsDto,
    description: "Additional settings",
  })
  @IsOptional()
  settings?: MembershipSettingsDto;

  @ApiProperty({
    type: [AccessHourDto],
    description: "Associated access hours",
  })
  @IsOptional()
  accessHours?: AccessHourDto[];

  @ApiProperty({
    type: [AccessFeatureDto],
    description: "Associated access features",
  })
  @IsOptional()
  accessFeatures?: AccessFeatureDto[];

  @ApiPropertyOptional({
    example: "Terms and conditions for this membership",
    description: "Terms and conditions in HTML format",
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @ApiPropertyOptional({
    type: [DoorDto],
    description: "Doors associated with this membership",
  })
  @IsOptional()
  doors?: DoorDto[];

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}




