import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsEmail,
  Min,
  Max,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import {
  ECurrency,
  EDateFormat,
  ETimeFormat,
  ENotificationFrequency,
  ETheme,
} from "../../enums/user-settings.enum";
import { getTimezoneOptionsWithSystem } from "../../constants/timezone.constants";

// Currency Settings
export class CurrencySettingsDto {
  @ApiProperty({
    example: "USD",
    description: "Default currency",
    enum: ECurrency,
  })
  @IsEnum(ECurrency)
  @IsOptional()
  @FieldType("select", false)
  @FieldOptions(Object.values(ECurrency).map((v) => ({ value: v, label: v })))
  defaultCurrency?: ECurrency;

  @ApiProperty({ example: "$", description: "Currency symbol" })
  @IsString()
  @IsOptional()
  @FieldType("text", false)
  currencySymbol?: string;
}

export class TimeSettingsDto {
  @ApiProperty({
    example: "MM/DD/YYYY",
    description: "Date format",
    enum: EDateFormat,
  })
  @IsEnum(EDateFormat)
  @IsOptional()
  @FieldType("select", false)
  @FieldOptions(Object.values(EDateFormat).map((v) => ({ value: v, label: v })))
  dateFormat?: EDateFormat;

  @ApiProperty({
    example: "12h",
    description: "Time format",
    enum: ETimeFormat,
  })
  @IsEnum(ETimeFormat)
  @IsOptional()
  @FieldType("select", false)
  @FieldOptions(Object.values(ETimeFormat).map((v) => ({ value: v, label: v })))
  timeFormat?: ETimeFormat;

  @ApiProperty({
    example: "America/New_York",
    description: "Timezone (IANA timezone identifier)",
  })
  @IsString()
  @IsOptional()
  @FieldType("select", false)
  @FieldOptions(
    getTimezoneOptionsWithSystem().map((tz) => ({
      value: tz.value,
      label: tz.label,
    }))
  )
  timezone?: string;
}

// Limits Settings
export class LimitSettingsDto {
  @ApiProperty({ example: 10, description: "Maximum sessions per day" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  maxSessionsPerDay?: number;

  @ApiProperty({ example: 20, description: "Maximum members per trainer" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  maxMembersPerSession?: number;

  @ApiProperty({ example: 20, description: "Maximum members per trainer" })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  maxMembersPerTrainer?: number;

  @ApiProperty({
    example: 60,
    description: "Default session duration in minutes",
  })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(480)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  maxSessionDuration?: number;

  @ApiProperty({
    example: 15,
    description: "Time slot step in minutes when generating availability",
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(180)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  slotStepMinutes?: number;
}

// Billing Settings
export class BillingSettingsDto {
  @ApiProperty({ example: 8.5, description: "Tax rate (%)" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  taxRate?: number;

  @ApiProperty({ example: "INV-", description: "Invoice prefix" })
  @IsString()
  @IsOptional()
  @FieldType("text", false)
  invoicePrefix?: string;

  @ApiProperty({ example: 2.5, description: "Platform commission rate (%)" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @FieldType("number", false)
  @Expose()
  @Type(() => Number)
  commissionRate?: number;
}

// Notification Settings
export class NotificationSettingsDto {
  @ApiProperty({ example: true, description: "Enable email notifications" })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  emailEnabled?: boolean;

  @ApiProperty({ example: true, description: "Enable SMS notifications" })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  smsEnabled?: boolean;

  @ApiProperty({ example: true, description: "Enable push notifications" })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  pushEnabled?: boolean;

  @ApiProperty({ example: true, description: "Enable in-app notifications" })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  inAppEnabled?: boolean;
}

// Theme Settings
export class ThemeSettingsDto {
  @ApiProperty({
    example: "system",
    description: "Theme preference",
    enum: ETheme,
  })
  @IsEnum(ETheme)
  @IsOptional()
  @FieldType("select", false)
  @FieldOptions(
    Object.values(ETheme).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  theme?: ETheme;
}

// Main User Settings DTO
export class CreateOrUpdateUserSettingsDto {
  @ApiProperty({ type: CurrencySettingsDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => CurrencySettingsDto)
  @FieldType("nested", false, CurrencySettingsDto)
  currency?: CurrencySettingsDto;

  @ApiProperty({ type: TimeSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => TimeSettingsDto)
  @FieldType("nested", false, TimeSettingsDto)
  time?: TimeSettingsDto;

  @ApiProperty({ type: LimitSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => LimitSettingsDto)
  @FieldType("nested", false, LimitSettingsDto)
  limits?: LimitSettingsDto;

  @ApiProperty({ type: BillingSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BillingSettingsDto)
  @FieldType("nested", false, BillingSettingsDto)
  billing?: BillingSettingsDto;

  @ApiProperty({ type: NotificationSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => NotificationSettingsDto)
  @FieldType("nested", false, NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @ApiProperty({ type: ThemeSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => ThemeSettingsDto)
  @FieldType("nested", false, ThemeSettingsDto)
  theme?: ThemeSettingsDto;
}

export class UserSettingsDto {
  @ApiProperty({ type: CurrencySettingsDto })
  @IsOptional()
  currency?: CurrencySettingsDto;

  @ApiProperty({ type: TimeSettingsDto })
  @IsOptional()
  time?: TimeSettingsDto;

  @ApiProperty({ type: LimitSettingsDto })
  @IsOptional()
  limits?: LimitSettingsDto;

  @ApiProperty({ type: BillingSettingsDto })
  @IsOptional()
  billing?: BillingSettingsDto;

  @ApiProperty({ type: NotificationSettingsDto })
  @IsOptional()
  notifications?: NotificationSettingsDto;

  @ApiProperty({ type: ThemeSettingsDto })
  @IsOptional()
  theme?: ThemeSettingsDto;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}
