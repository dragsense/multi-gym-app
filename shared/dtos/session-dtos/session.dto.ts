import {
  IsString,
  MaxLength,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  Min,
  IsEnum,
  IsArray,
  ValidateIf,
  ArrayMinSize,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { OmitType, PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import {
  IsDateArray,
  TransformToArray,
  Between,
  In,
  Equals,
  TransformToBoolean,
} from "../../decorators/crud.dto.decorators";
import {
  ESessionStatus,
  ESessionType,
  EUpdateSessionScope,
} from "../../enums/session.enum";
import type { ISession } from "../../interfaces/session.interface";
import { ReminderDto } from "../reminder-dtos";
import { RecurrenceConfigDto } from "../recurrence-dtos";
import { MemberDto } from "../member-dtos";
import { ServiceOfferDto } from "../service-offer-dtos";
import { LocationDto } from "../location-dtos/location.dto";
import { StaffDto } from "../staff-dtos";

// Custom validator to ensure endDate is required and within one year when recurrence is enabled
@ValidatorConstraint({ name: "recurrenceEndDateValid", async: false })
export class RecurrenceEndDateValidConstraint
  implements ValidatorConstraintInterface
{
  validate(recurrenceEndDate: any, args: ValidationArguments) {
    const obj = args.object as CreateSessionDto;

    // If recurrence is not enabled, no validation needed
    if (!obj.enableRecurrence) {
      return true;
    }

    // If recurrence is enabled, recurrenceEndDate must exist
    if (!recurrenceEndDate) {
      return false;
    }

    // endDate must not be more than one year from startDateTime
    if (obj.startDateTime && recurrenceEndDate) {
      const startDate = new Date(obj.startDateTime as string);
      const endDate = new Date(recurrenceEndDate as string);

      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
      }

      const oneYearFromStart = new Date(startDate.getTime());
      oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1);

      // endDate must be after startDateTime and not more than one year
      if (endDate <= startDate || endDate > oneYearFromStart) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const obj = args.object as CreateSessionDto;
    if (!obj.recurrenceEndDate) {
      return "End date is required when recurrence is enabled";
    }
    return "End date must be within one year from the start date";
  }
}

export class CreateSessionDto {
  @ApiProperty({ example: "Morning Workout", description: "Session title" })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  title: string;

  @ApiProperty({
    example: "Cardio and strength training session",
    description: "Session description",
  })
  @IsString()
  @IsOptional()
  @FieldType("textarea", false)
  @MaxLength(500, { message: 'Description cannot be longer than 500 characters' }) //Lenght of Description added
  description?: string;

  @ApiProperty({
    example: "2024-01-15T09:00:00.000Z",
    description: "Session start date and time",
  })
  @IsDateString()
  @IsNotEmpty()
  @FieldType("datetime", true)
  startDateTime: string;

  @ApiPropertyOptional({
    example: 60,
    description: "Session duration in minutes",
  })
  @IsNumber()
  @Min(1)
  @FieldType("number")
  @Expose()
  @Type(() => Number)
  duration: number;

  @ApiProperty({ type: StaffDto })
  @ValidateNested()
  @Expose()
  @Type(() => StaffDto)
  @FieldType("nested", true, StaffDto)
  @IsOptional()
  trainer?: StaffDto;

  @ApiProperty({
    type: [MemberDto],
    description: "Associated members (at least one required)",
  })
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => MemberDto)
  @FieldType("nested", true, MemberDto)
  @IsArray()
  @ArrayMinSize(1, { message: "At least one member must be selected" })
  members: MemberDto[];

  @ApiProperty({
    example: "CUSTOM",
    description: "Session type",
    enum: ESessionType,
  })
  @IsEnum(ESessionType)
  @IsNotEmpty()
  @FieldType("select", true)
  @FieldOptions(
    Object.values(ESessionType).map((v) => ({
      value: v,
      label: v.charAt(0) + v.slice(1).toLowerCase(),
    }))
  )
  type: ESessionType;

  @ApiPropertyOptional({
    type: LocationDto,
    description: "Location associated with this session",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => LocationDto)
  @FieldType("nested", false, LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({
    example: "Gym Floor A",
    description: "Session location (text field)",
  })
  @IsOptional()
  @IsString()
  @FieldType("text")
  locationText?: string;

  @ApiPropertyOptional({ example: 50, description: "Session price" })
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    type: ServiceOfferDto,
    description: "Service offer for this session (optional)",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => ServiceOfferDto)
  @FieldType("nested", false, ServiceOfferDto)
  serviceOffer?: ServiceOfferDto;

  @ApiPropertyOptional({
    example: false,
    description: "Whether to use custom price instead of service offers price",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch")
  useCustomPrice?: boolean;

  @ApiPropertyOptional({
    example: 75,
    description: "Custom price (used when useCustomPrice is true)",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @FieldType("number")
  @Expose()
  @Type(() => Number)
  @ValidateIf((o) => o.useCustomPrice === true)
  customPrice?: number;

  @ApiPropertyOptional({
    example: "Bring water bottle and towel",
    description: "Session notes",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea")
  notes?: string;

  @ApiPropertyOptional({ type: ReminderDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => ReminderDto)
  @FieldType("nested", false, ReminderDto)
  @ValidateIf((o) => o.enableReminder === true)
  reminderConfig?: ReminderDto;

  @ApiPropertyOptional({
    example: true,
    description: "Whether reminders are enabled for this session",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch")
  enableReminder?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: "Whether recurrence is enabled for this session",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch")
  enableRecurrence?: boolean;

  @ApiPropertyOptional({
    example: "2024-12-31T23:59:59.000Z",
    description: "End date of the recurrence for this session",
    required: false,
  })
  @IsNotEmpty()
  @IsDateString()
  @FieldType("date", true)
  @Validate(RecurrenceEndDateValidConstraint)
  @ValidateIf((o) => o.enableRecurrence === true)
  recurrenceEndDate?: string;

  @ApiPropertyOptional({ type: RecurrenceConfigDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => RecurrenceConfigDto)
  @FieldType("nested", false, RecurrenceConfigDto)
  @ValidateIf((o) => o.enableRecurrence === true)
  recurrenceConfig?: RecurrenceConfigDto;

  @ApiPropertyOptional({
    example: ESessionStatus.SCHEDULED,
    description: "Session status",
    enum: ESessionStatus,
  })
  @IsOptional()
  @IsEnum(ESessionStatus)
  @FieldType("select", false)
  status?: ESessionStatus;
}

// Re-define UpdateSessionDto to exclude 'notes'
export class UpdateSessionDto extends PartialType(
  OmitType(CreateSessionDto, ["notes"] as const)
) {
  // update scope
  @ApiPropertyOptional({
    example: EUpdateSessionScope.ALL,
    description: "Update scope (this, all, thisAndFollowing)",
  })
  @IsOptional()
  @IsEnum(EUpdateSessionScope)
  @ValidateIf((o) => o.enableRecurrence === true)
  updateScope?: EUpdateSessionScope;

  @ApiPropertyOptional({
    example: "Client requested time change",
    description: "Reason for date/time change (will be appended to notes)",
  })
  @IsOptional()
  @IsString()
  dateChangeReason?: string;

  @ApiPropertyOptional({
    example: "Client requested cancellation",
    description: "Reason for cancellation or status change",
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateSessionNotesDto {
  @ApiPropertyOptional({
    example: "Bring water bottle and towel",
    description: "Session notes",
  })
  @IsOptional()
  @IsString()
  @FieldType("quill", false)
  notes?: string;

  @ApiPropertyOptional({
    example: EUpdateSessionScope.ALL,
    description: "Update scope (this, all, thisAndFollowing)",
  })
  @IsOptional()
  @IsEnum(EUpdateSessionScope)
  updateScope?: EUpdateSessionScope;
}

export class AvailableSlotsRequestDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Trainer ID",
  })
  @IsNotEmpty()
  @IsString()
  trainerId: string;

  @ApiProperty({
    type: [String],
    example: [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002",
    ],
    description: "Array of member IDs",
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  memberIds: string[];

  @ApiProperty({
    example: "2024-01-15",
    description: "Date to check availability (YYYY-MM-DD)",
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: 60,
    description: "Session duration in minutes",
    default: 60,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Expose()
  @Type(() => Number)
  duration?: number;
}

export class AvailableTimeSlotDto {
  @ApiProperty({
    example: "2024-01-15T09:00:00.000Z",
    description: "Available start time",
  })
  startTime: string;

  @ApiProperty({
    example: "2024-01-15T10:00:00.000Z",
    description: "Available end time",
  })
  endTime: string;
}

export class AvailableSlotsResponseDto {
  @ApiProperty({
    type: [AvailableTimeSlotDto],
    description: "List of available time slots",
  })
  slots: AvailableTimeSlotDto[];

  @ApiProperty({
    example: "2024-01-15",
    description: "Date for which slots were calculated",
  })
  date: string;
}

export class AvailableDatesRequestDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Trainer ID",
  })
  @IsNotEmpty()
  @IsString()
  trainerId: string;

  @ApiProperty({
    type: [String],
    example: [
      "550e8400-e29b-41d4-a716-446655440001",
      "550e8400-e29b-41d4-a716-446655440002",
    ],
    description: "Array of member IDs",
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  memberIds: string[];
}

export class UnavailableDateRangeDto {
  @ApiProperty({
    type: String,
    example: "2024-01-17",
    description: "Start date of unavailable range (YYYY-MM-DD)",
  })
  startDate: string;

  @ApiProperty({
    type: String,
    example: "2024-01-19",
    description: "End date of unavailable range (YYYY-MM-DD)",
  })
  endDate: string;
}

export class AvailableDatesResponseDto {
  @ApiProperty({
    type: [String],
    example: ["sunday", "saturday"],
    description: "List of off days (days of the week that are unavailable)",
  })
  offDays: string[];

  @ApiProperty({
    type: [UnavailableDateRangeDto],
    example: [
      { startDate: "2024-01-17", endDate: "2024-01-19", reason: "Vacation" },
    ],
    description: "List of unavailable date ranges",
  })
  @Expose()
  @Type(() => UnavailableDateRangeDto)
  unavailableRanges: UnavailableDateRangeDto[];
}

export class SessionPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [SessionDto] })
  @Expose()
  @Type(() => SessionDto)
  data: SessionDto[];
}

export class SessionListDto extends ListQueryDto<ISession> {
  @ApiPropertyOptional({
    example: ["SCHEDULED", "CANCELLED"],
    description: "Filter by session status",
  })
  @IsOptional()
  @IsEnum(ESessionStatus, { each: true })
  @In()
  @FieldType("multiSelect", false)
  @FieldOptions([
    { value: ESessionStatus.SCHEDULED, label: "Scheduled" },
    { value: ESessionStatus.RESCHEDULED, label: "Rescheduled" },
    { value: ESessionStatus.CANCELLED, label: "Cancelled" },
    { value: ESessionStatus.COMPLETED, label: "Completed" },
  ])
  @TransformToArray()
  status?: ESessionStatus[];

  //enable recurrence
  @ApiPropertyOptional({
    example: true,
    description: "Filter by enable recurrence",
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
  enableRecurrence?: boolean;

  @ApiPropertyOptional({
    example: "2024-01-01",
    description: "Filter by start date",
  })
  @IsOptional()
  @IsDateArray()
  @TransformToArray()
  @Between()
  @FieldType("dateRange", false)
  startDateTime?: string[];

  @ApiPropertyOptional({
    description: "Filter by location ID",
  })
  @IsOptional()
  @IsUUID()
  @Equals()
  locationId?: string;
}

export class SessionDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Session ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({ example: "Morning Workout", description: "Session title" })
  @IsOptional()
  @IsString()
  title: string;

  @ApiProperty({
    example: "Cardio and strength training session",
    description: "Session description",
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    example: "2024-01-15T09:00:00.000Z",
    description: "Session start date and time",
  })
  @IsOptional()
  startDateTime: string;

  @ApiPropertyOptional({
    example: 60,
    description: "Session duration in minutes",
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({
    example: "2024-01-15T10:00:00.000Z",
    description: "Session end date and time (auto-calculated)",
  })
  @IsOptional()
  endDateTime?: string;

  @ApiProperty({ example: "PERSONAL", description: "Session type" })
  @IsOptional()
  type: ESessionType;

  @ApiPropertyOptional({
    example: "Gym Floor A",
    description: "Session location",
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 50, description: "Session price" })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    type: ServiceOfferDto,
    description: "Service offer for this session",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => ServiceOfferDto)
  serviceOffer?: ServiceOfferDto;

  @ApiPropertyOptional({
    example: false,
    description: "Whether to use custom price instead of service offers price",
  })
  @IsOptional()
  @IsBoolean()
  useCustomPrice?: boolean;

  @ApiPropertyOptional({
    example: 75,
    description: "Custom price (used when useCustomPrice is true)",
  })
  @IsOptional()
  @IsNumber()
  customPrice?: number;

  @ApiPropertyOptional({
    example: "Bring water bottle and towel",
    description: "Session notes",
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: "Client requested time change",
    description: "Additional notes for this session",
  })
  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @ApiProperty({ example: "SCHEDULED", description: "Session status" })
  @IsOptional()
  status: ESessionStatus;

  @ApiProperty({ type: StaffDto })
  @ValidateNested()
  @Expose()
  @Type(() => StaffDto)
  trainer: StaffDto;

  @ApiProperty({ type: [MemberDto] })
  @ValidateNested()
  @Expose()
  @Type(() => MemberDto)
  @IsArray()
  members: MemberDto[];

  @ApiProperty({ example: 1, description: "Number of members" })
  @IsOptional()
  @IsNumber()
  @Expose()
  @Type(() => Number)
  @FieldType("number", true)
  @Min(0)
  membersUsersCount?: number;

  @ApiProperty({ example: 1, description: "Count of members" })
  @IsOptional()
  @IsNumber()
  @Expose()
  @Type(() => Number)
  @Min(0)
  membersCount?: number;

  @ApiPropertyOptional({
    example: true,
    description: "Whether reminders are enabled for this session",
  })
  @IsOptional()
  @IsBoolean()
  enableReminders?: boolean;

  @ApiPropertyOptional({ type: ReminderDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => ReminderDto)
  @FieldType("nested", false, ReminderDto)
  @ValidateIf((o) => o.enableReminder === true)
  reminderConfig?: ReminderDto;

  @ApiPropertyOptional({ type: RecurrenceConfigDto })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => RecurrenceConfigDto)
  @FieldType("nested", false, RecurrenceConfigDto)
  @ValidateIf((o) => o.enableRecurrence === true)
  recurrenceConfig?: RecurrenceConfigDto;

  @ApiPropertyOptional({
    example: true,
    description: "Whether recurrence is enabled for this session",
  })
  @IsOptional()
  @IsBoolean()
  enableRecurrence?: boolean;

  @ApiPropertyOptional({
    example: "2024-12-31T23:59:59.000Z",
    description: "End date of the recurrence for this session",
  })
  @IsOptional()
  recurrenceEndDate?: Date;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;

  @ApiPropertyOptional({
    example: "Client requested cancellation",
    description: "Reason for cancellation or status change",
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CalendarEventsRequestDto {
  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Start date for calendar events (required)",
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    example: "2024-12-31T23:59:59.999Z",
    description: "End date for calendar events (required)",
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  //status filter
  @ApiProperty({
    example: "SCHEDULED",
    description: "Status filter",
  })
  @IsOptional()
  @IsEnum(ESessionStatus, { each: true })
  @FieldType("select", false)
  @TransformToArray()
  statuses?: ESessionStatus[];

  @ApiPropertyOptional({
    example: 5,
    description: "Limit the number of sessions to return",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Expose()
  @Type(() => Number)
  limit?: number;
}

export class SessionPaymentIntentDto {
  @ApiProperty({ description: "Session ID" })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: "Member ID" })
  @IsUUID()
  memberId: string;

  @ApiProperty({
    description: "Stripe payment method ID (from frontend)",
    example: "pm_123",
  })
  @IsString()
  paymentMethodId: string;

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
