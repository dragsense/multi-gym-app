import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  IsDate,
  IsObject,
  IsInt,
  Min,
  Max,
  IsArray,
  IsDateString,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Transform } from "class-transformer";
import {
  EScheduleStatus,
  EScheduleFrequency,
  EDayOfWeek,
  EMonth,
  EIntervalUnit,
} from "../../enums/schedule.enum";
import { ListQueryDto } from "../common/list-query.dto";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ISchedule } from "../../interfaces/schedule.interface";
import { FieldOptions, FieldType } from "../../decorators/field.decorator";

export class CreateScheduleDto {
  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Tenant ID for multi-tenant database routing",
  })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({ example: "Daily Report Generation" })
  @IsString()
  @IsOptional()
  @FieldType("text", true)
  title?: string;

  @ApiPropertyOptional({
    example: "Automated daily summary of user activity",
    description: "Optional description displayed in the UI",
  })
  @IsString()
  @IsOptional()
  @FieldType("textarea")
  description?: string;

  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiProperty({ example: "generateReport" })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ example: { format: "pdf" } })
  @IsObject()
  @IsOptional()
  @FieldType("textarea")
  data?: Record<string, any>;

  @ApiProperty({ enum: EScheduleFrequency, example: EScheduleFrequency.DAILY })
  @IsEnum(EScheduleFrequency)
  @IsOptional()
  @FieldType("select", true)
  @FieldOptions(
    Object.values(EScheduleFrequency).map((v) => ({
      value: v,
      label: v.charAt(0) + v.slice(1).toLowerCase(),
    }))
  )
  frequency?: EScheduleFrequency;

  @ApiProperty({ example: "2025-10-15T00:00:00Z", description: "Start date" })
  @IsDateString()
  @IsOptional()
  @FieldType("date", true)
  startDate?: string;

  @ApiPropertyOptional({
    example: "2025-12-31T00:00:00Z",
    description: "End date (when schedule expires)",
  })
  @IsDateString()
  @IsOptional()
  @FieldType("date")
  endDate?: string;

  @ApiPropertyOptional({
    example: "2025-10-16T00:00:00Z",
    description:
      "Override the calculated next run date when creating a schedule",
  })
  @IsDateString()
  @IsOptional()
  @FieldType("date")
  nextRunDate?: string;

  @ApiPropertyOptional({
    example: "09:00",
    description: "Start time (HH:mm), defaults to 00:00",
  })
  @IsString()
  @IsOptional()
  @FieldType("time")
  timeOfDay?: string;

  @ApiPropertyOptional({
    example: "18:00",
    description: "End time (HH:mm) - when to stop intervals",
  })
  @IsString()
  @IsOptional()
  @FieldType("time")
  endTime?: string;

  @ApiPropertyOptional({ example: 30, description: "Interval value" })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  @FieldType("number")
  intervalValue?: number;

  @ApiPropertyOptional({
    enum: EIntervalUnit,
    example: EIntervalUnit.MINUTES,
    description: "Interval unit (minutes or hours)",
  })
  @IsEnum(EIntervalUnit)
  @IsOptional()
  @FieldType("select")
  @FieldOptions(
    Object.values(EIntervalUnit).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  intervalUnit?: EIntervalUnit;

  @ApiPropertyOptional({
    example: 30,
    description:
      "Interval in minutes (auto-calculated from intervalValue * intervalUnit)",
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  @Transform(
    ({ obj }) => {
      if (!obj.intervalValue || obj.intervalValue === 0) return undefined;
      const unit = obj.intervalUnit || EIntervalUnit.MINUTES;
      const calculated =
        unit === EIntervalUnit.HOURS
          ? obj.intervalValue * 60
          : obj.intervalValue;
      return calculated;
    },
    { toClassOnly: true }
  )
  interval?: number;

  @ApiPropertyOptional({
    example: "America/New_York",
    description: "Timezone (e.g., America/New_York, UTC, Asia/Tokyo)",
  })
  @IsString()
  @IsOptional()
  @FieldType("text")
  timezone?: string;

  @ApiPropertyOptional({
    example: "0 9 * * 1,5",
    description: "Generated cron expression (auto-calculated)",
  })
  @IsString()
  @IsOptional()
  cronExpression?: string;

  @ApiPropertyOptional({
    example: [1, 2, 3, 4, 5],
    description:
      "Days of week for WEEKLY schedules (0=Sunday, 1=Monday, ..., 6=Saturday)",
    type: [Number],
  })
  @IsArray()
  @IsEnum(EDayOfWeek, { each: true })
  @IsOptional()
  @Type(() => Number)
  @FieldType("multiSelect")
  @FieldOptions(
    Object.entries(EDayOfWeek)
      .filter(([key, value]) => typeof value === "number")
      .map(([key, value]) => ({
        value: value.toString(),
        label: key.charAt(0) + key.slice(1).toLowerCase(),
      }))
  )
  weekDays?: EDayOfWeek[];

  @ApiPropertyOptional({
    example: [1, 15, 30],
    description: "Days of month for MONTHLY schedules (1-31)",
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  @IsOptional()
  @Type(() => Number)
  @FieldType("multiSelect")
  @FieldOptions(
    Array.from({ length: 31 }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString(),
    }))
  )
  monthDays?: number[];

  @ApiPropertyOptional({
    example: [1, 6, 12],
    description: "Months for YEARLY schedules (1-12)",
    type: [Number],
  })
  @IsArray()
  @IsEnum(EMonth, { each: true })
  @IsOptional()
  @Type(() => Number)
  @FieldType("multiSelect")
  @FieldOptions(
    Object.entries(EMonth)
      .filter(([key, value]) => typeof value === "number")
      .map(([key, value]) => ({
        value: value.toString(),
        label: key.charAt(0) + key.slice(1).toLowerCase(),
      }))
  )
  months?: number[];

  @ApiPropertyOptional({
    example: true,
    description: "Whether to retry on failure",
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @FieldType("switch")
  retryOnFailure?: boolean;

  @ApiPropertyOptional({
    example: 3,
    description: "Maximum number of retries",
  })
  @IsOptional()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  @FieldType("number")
  maxRetries?: number;

  @ApiPropertyOptional({
    example: 5,
    description: "Delay between retries in minutes",
  })
  @IsOptional()
  @Min(1)
  @Max(60)
  @Type(() => Number)
  @FieldType("number")
  retryDelayMinutes?: number;
}

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {
  @ApiPropertyOptional({ enum: EScheduleStatus })
  @IsEnum(EScheduleStatus)
  @IsOptional()
  @FieldType("select")
  @FieldOptions(
    Object.values(EScheduleStatus).map((v) => ({
      value: v,
      label: v.charAt(0) + v.slice(1).toLowerCase(),
    }))
  )
  status?: EScheduleStatus;
}

export class SchedulePaginationDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [ScheduleDto] })
  @Type(() => ScheduleDto)
  data: ScheduleDto[];
}

export class ScheduleListDto extends ListQueryDto<ISchedule> {
  @ApiPropertyOptional({ enum: EScheduleStatus })
  @IsOptional()
  @IsEnum(EScheduleStatus)
  @FieldType("select")
  @FieldOptions(
    Object.values(EScheduleStatus).map((v) => ({
      value: v,
      label: v.charAt(0) + v.slice(1).toLowerCase(),
    }))
  )
  status?: EScheduleStatus;

  @ApiPropertyOptional({ enum: EScheduleFrequency })
  @IsOptional()
  @IsEnum(EScheduleFrequency)
  @FieldType("select")
  @FieldOptions(
    Object.values(EScheduleFrequency).map((v) => ({
      value: v,
      label: v.charAt(0) + v.slice(1).toLowerCase(),
    }))
  )
  frequency?: EScheduleFrequency;

  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  entityId?: string;
}

export class ScheduleDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Tenant ID for multi-tenant database routing",
  })
  tenantId?: string;

  @ApiProperty({ example: "Daily Report" })
  title: string;

  @ApiPropertyOptional({
    example: "Automated daily summary of user activity",
    description: "Optional description displayed in the UI",
  })
  description?: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  entityId?: string;

  @ApiProperty({ example: "generateReport" })
  action: string;

  @ApiProperty({ example: { format: "pdf" } })
  data?: Record<string, any>;

  @ApiProperty({ enum: EScheduleFrequency })
  frequency: EScheduleFrequency;

  @ApiProperty({ example: "2025-10-15T00:00:00Z" })
  startDate: string;

  @ApiProperty({ example: "2025-12-31T00:00:00Z" })
  endDate?: string;

  @ApiProperty({ example: "09:00" })
  timeOfDay?: string;

  @ApiProperty({ example: "18:00" })
  endTime?: string;

  @ApiProperty({ example: 30 })
  intervalValue?: number;

  @ApiProperty({ enum: EIntervalUnit })
  intervalUnit?: EIntervalUnit;

  @ApiProperty({ example: 30 })
  interval?: number;

  @ApiProperty({ example: "America/New_York" })
  timezone?: string;

  @ApiProperty({ example: [1, 2, 3, 4, 5], type: [Number] })
  weekDays?: EDayOfWeek[];

  @ApiProperty({ example: [1, 15, 30], type: [Number] })
  monthDays?: number[];

  @ApiProperty({ example: [1, 6, 12], type: [Number] })
  months?: number[];

  @ApiProperty({ enum: EScheduleStatus })
  status: EScheduleStatus;

  @ApiProperty({ example: "2025-10-16T00:00:00Z" })
  nextRunDate: string;

  @ApiProperty({ example: "2025-10-15T09:00:00Z" })
  lastRunAt?: string;

  @ApiProperty({ example: 10 })
  executionCount: number;

  @ApiProperty({ example: 8 })
  successCount: number;

  @ApiProperty({ example: 2 })
  failureCount: number;

  @ApiProperty({ example: "success" })
  lastExecutionStatus?: string;

  @ApiProperty({ example: "Connection timeout" })
  lastErrorMessage?: string;

  @ApiProperty({
    example: [{ executedAt: "2025-10-15T09:00:00Z", status: "success" }],
  })
  executionHistory?: Array<{
    executedAt: string;
    status: "success" | "failed";
    errorMessage?: string;
  }>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
