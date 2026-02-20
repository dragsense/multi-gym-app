import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsNumber,
  Matches,
  ValidateNested,
  Min,
  ValidateIf,
} from "class-validator";
import { Type, Expose } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType, createPartialType } from "../../lib/type-utils";
import { FieldType } from "../../decorators/field.decorator";

export class TimeSlotDto {
  @ApiProperty({
    type: String,
    example: "09:00",
    description: "Start time of the slot (HH:mm)",
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Start time must be in HH:mm format",
  })
  @FieldType("time", true)
  start!: string;

  @ApiProperty({
    type: String,
    example: "17:00",
    description: "End time of the slot (HH:mm)",
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "End time must be in HH:mm format",
  })
  @FieldType("time", true)
  end!: string;
}

export class DayScheduleDto {
  @ApiProperty({
    type: Boolean,
    example: true,
    description: "Whether the day is enabled for availability",
  })
  @IsBoolean()
  @FieldType("switch", true)
  enabled!: boolean;

  @ApiProperty({
    type: [TimeSlotDto],
    description: "Array of time slots for the day",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => TimeSlotDto)
  @ArrayMaxSize(5)
  @FieldType("nestedArray", true, TimeSlotDto)
  @ValidateIf((obj) => obj.enabled)
  timeSlots?: TimeSlotDto[];
}

export class UnavailablePeriodDto {
  @ApiProperty({
    type: String,
    example: "Vacation",
    description: "Reason for unavailability",
  })
  @IsString()
  @FieldType("text", true)
  reason!: string;

  @ApiProperty({
    type: String,
    example: ["2024-07-01", "2024-07-05"],
    description: "Date range of the unavailable period (YYYY-MM-DD)",
  })
  @IsArray()
  @FieldType("dateRangeString", true)
  dateRange!: [string | null, string | null];
}

export class WeeklyScheduleDto {
  @ApiProperty({
    type: DayScheduleDto,
    description: "Monday schedule",
  })
  @ValidateNested()
  @Expose()
  @Type(() => DayScheduleDto)
  @FieldType("nested", true, DayScheduleDto)
  @IsOptional()
  monday?: DayScheduleDto;

  @ApiProperty({
    type: DayScheduleDto,
    description: "Tuesday schedule",
  })
  @ValidateNested()
  @Expose()
  @Type(() => DayScheduleDto)
  @FieldType("nested", true, DayScheduleDto)
  @IsOptional()
  tuesday?: DayScheduleDto;

  @ApiProperty({
    type: DayScheduleDto,
    description: "Wednesday schedule",
  })
  @ValidateNested()
  @Expose()
  @Type(() => DayScheduleDto)
  @FieldType("nested", true, DayScheduleDto)
  @IsOptional()
  wednesday?: DayScheduleDto;

  @ApiProperty({
    type: DayScheduleDto,
    description: "Thursday schedule",
  })
  @ValidateNested()
  @Expose()
  @Type(() => DayScheduleDto)
  @FieldType("nested", true, DayScheduleDto)
  @IsOptional()
  thursday?: DayScheduleDto;

  @ApiProperty({
    type: DayScheduleDto,
    description: "Friday schedule",
  })
  @ValidateNested()
  @Expose()
  @Type(() => DayScheduleDto)
  @FieldType("nested", true, DayScheduleDto)
  @IsOptional()
  friday?: DayScheduleDto;

  @ApiProperty({
    type: DayScheduleDto,
    description: "Saturday schedule",
  })
  @ValidateNested()
  @Expose()
  @Type(() => DayScheduleDto)
  @FieldType("nested", true, DayScheduleDto)
  @IsOptional()
  saturday?: DayScheduleDto;

  @ApiProperty({
    type: DayScheduleDto,
    description: "Sunday schedule",
  })
  @ValidateNested()
  @Expose()
  @Type(() => DayScheduleDto)
  @FieldType("nested", true, DayScheduleDto)
  @IsOptional()
  sunday?: DayScheduleDto;
}

export class UserAvailabilityDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "User Availability ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id!: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440001",
    description: "User ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  userId!: string;

  @ApiProperty({
    type: () => WeeklyScheduleDto,
    description: "Weekly schedule object",
  })
  @IsObject()
  @ValidateNested()
  @Expose()
  @Type(() => WeeklyScheduleDto)
  @FieldType("nested", true, WeeklyScheduleDto)
  weeklySchedule!: WeeklyScheduleDto;

  @ApiProperty({
    type: () => [UnavailablePeriodDto],
    description: "List of unavailable periods",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => UnavailablePeriodDto)
  @FieldType("nested", true, UnavailablePeriodDto)
  unavailablePeriods!: UnavailablePeriodDto[];

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Creation timestamp",
  })
  createdAt!: Date;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Last update timestamp",
  })
  updatedAt!: Date;
}

export class CreateUserAvailabilityDto {
  @ApiProperty({
    description: "Weekly schedule for the user",
    type: WeeklyScheduleDto,
  })
  @ValidateNested()
  @Expose()
  @Type(() => WeeklyScheduleDto)
  @FieldType("nested", true, WeeklyScheduleDto)
  @IsOptional()
  weeklySchedule?: WeeklyScheduleDto;

  @ApiProperty({
    description: "List of unavailable periods",
    type: [UnavailablePeriodDto],
    required: false,
    example: [
      {
        startDate: "2025-08-10",
        endDate: "2025-08-15",
        reason: "Vacation",
      },
    ],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => UnavailablePeriodDto)
  @ArrayMaxSize(10)
  @FieldType("nestedArray", true, UnavailablePeriodDto)
  unavailablePeriods?: UnavailablePeriodDto[];
}

export class UpdateUserAvailabilityDto extends createPartialType(
  CreateUserAvailabilityDto
) {}

export class CheckUserAvailabilityRequestDto {
  @ApiProperty({
    example: "2024-01-15T09:00:00.000Z",
    description: "Date and time to check availability (ISO 8601 format)",
  })
  @IsNotEmpty()
  @IsDateString()
  dateTime: string;

  @ApiPropertyOptional({
    example: 60,
    description: "Duration in minutes",
    default: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Expose()
  @Type(() => Number)
  duration?: number;

  @ApiPropertyOptional({
    example: "America/New_York",
    description: "Timezone for the date/time (IANA timezone identifier)",
    default: "UTC",
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CheckUserAvailabilityResponseDto {
  @ApiProperty({
    example: true,
    description: "Whether the user is available at the specified date and time",
  })
  @IsBoolean()
  isAvailable!: boolean;

  @ApiPropertyOptional({
    example: "User is not available on monday",
    description:
      "Reason for unavailability (only present when isAvailable is false)",
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
