import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsUUID,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
  ValidateIf,
  Validate,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto, SingleQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import {
  Equals,
  In,
  DateRange,
  TransformToDate,
  TransformToArray,
  RelationFilter,
} from "../../decorators/crud.dto.decorators";
import { UserDto } from "../user-dtos";
import { LocationDto } from "../location-dtos/location.dto";
import { DoorDto } from "../location-dtos/door.dto";
import { RecurrenceConfigDto } from "../recurrence-dtos";
import { ETaskStatus, ETaskPriority } from "../../enums/task.enum";

// Custom validator to ensure due date is valid ISO 8601 and not in the past
@ValidatorConstraint({ name: "isNotPastDate", async: false })
export class IsNotPastDateConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value) return false; // If value is not provided, it's invalid (handled by @IsNotEmpty)
    
    const date: Date = new Date(value);
     
    if (isNaN(date.getTime())) return false; // Invalid date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0); // Normalize checkDate to start of day
    return checkDate >= today;
  }

  defaultMessage() {
    return "Due date must be a valid ISO 8601 date string and cannot be in the past";
  }
}

export function IsNotPastDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotPastDateConstraint,
    });
  };
}

// Custom validator to ensure due date is greater than start date time
@ValidatorConstraint({ name: "dueDateAfterStartDateTime", async: false })
export class DueDateAfterStartDateTimeConstraint
  implements ValidatorConstraintInterface
{
  validate(dueDate: any, args: ValidationArguments) {
    const obj = args.object as CreateTaskDto;

    // If dueDate is not provided, validation passes (it's optional)
    if (!dueDate) {
      return true;
    }

    // If startDateTime is not provided, we can't validate
    if (!obj.startDateTime) {
      return true; // Let other validators handle startDateTime requirement
    }

    const startDate = new Date(obj.startDateTime as string);
    const dueDateObj = new Date(dueDate as string);

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(dueDateObj.getTime())) {
      return false;
    }

    // dueDate must be greater than startDateTime
    return dueDateObj > startDate;
  }

  defaultMessage() {
    return "Due date must be greater than start date time";
  }
}

export function DueDateAfterStartDateTime(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: DueDateAfterStartDateTimeConstraint,
    });
  };
}

// Custom validator to ensure endDate is required and within one year when recurrence is enabled
@ValidatorConstraint({ name: "taskRecurrenceEndDateValid", async: false })
export class TaskRecurrenceEndDateValidConstraint
  implements ValidatorConstraintInterface
{
  validate(recurrenceEndDate: any, args: ValidationArguments) {
    const obj = args.object as CreateTaskDto;

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
    const obj = args.object as CreateTaskDto;
    if (!obj.recurrenceEndDate) {
      return "End date is required when recurrence is enabled";
    }
    return "End date must be within one year from the start date";
  }
}

export class CreateTaskDto {
  @ApiProperty({
    example: "Complete project documentation",
    description: "Task title",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  title: string;

  @ApiPropertyOptional({
    example: "Write comprehensive documentation for the API endpoints",
    description: "Task description",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea", false)
  description?: string;

  @ApiPropertyOptional({
    enum: ETaskStatus,
    example: ETaskStatus.TODO,
    description: "Task status",
  })
  @IsOptional()
  @IsEnum(ETaskStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: ETaskStatus.TODO, label: "To Do" },
    { value: ETaskStatus.IN_PROGRESS, label: "In Progress" },
    { value: ETaskStatus.IN_REVIEW, label: "In Review" },
    { value: ETaskStatus.DONE, label: "Done" },
    { value: ETaskStatus.CANCELLED, label: "Cancelled" },
  ])
  status?: ETaskStatus;

  @ApiPropertyOptional({
    enum: ETaskPriority,
    example: ETaskPriority.MEDIUM,
    description: "Task priority",
  })
  @IsOptional()
  @IsEnum(ETaskPriority)
  @FieldType("select", false)
  @FieldOptions([
    { value: ETaskPriority.LOW, label: "Low" },
    { value: ETaskPriority.MEDIUM, label: "Medium" },
    { value: ETaskPriority.HIGH, label: "High" },
    { value: ETaskPriority.URGENT, label: "Urgent" },
  ])
  priority?: ETaskPriority;

  @ApiProperty({
    example: "2024-01-15T09:00:00.000Z",
    description: "Task start date and time",
  })
  @IsDateString()
  @IsNotEmpty()
  @FieldType("datetime", true)
  startDateTime: string | Date;

  @ApiProperty({
    example: "2024-12-31T23:59:59.000Z",
    description: "Due date for the task",
  })
  @IsNotEmpty()
  @IsDateString()
  @FieldType("datetime", true)
  @Validate(DueDateAfterStartDateTimeConstraint)
  dueDate: string | Date;

  @ApiProperty({
    type: UserDto,
    description: "User assigned to this task",
  })
  @IsNotEmpty()
  @ValidateNested()
  @Expose()
  @Type(() => UserDto)
  @FieldType("nested", true, UserDto)
  assignedTo: UserDto;

  @ApiPropertyOptional({
    example: ["documentation", "api"],
    description: "Tags for categorizing tasks",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @FieldType("tags", false)
  tags?: string[];

  @ApiPropertyOptional({
    example: 50,
    description: "Progress percentage (0-100)",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @FieldType("number", false)
  progress?: number;

  @ApiPropertyOptional({
    example: true,
    description: "Whether recurrence is enabled for this task",
  })
  @IsOptional()
  @IsBoolean()
  @FieldType("switch", false)
  enableRecurrence?: boolean;

  @ApiPropertyOptional({
    type: () => RecurrenceConfigDto,
    description: "Recurrence configuration",
  })
  @IsNotEmpty()
  @IsObject({ message: "Recurrence configuration is required" })
  @ValidateNested()
  @Expose()
  @Type(() => RecurrenceConfigDto)
  @FieldType("nested", true, RecurrenceConfigDto)
  @ValidateIf((o) => o.enableRecurrence === true)
  recurrenceConfig?: RecurrenceConfigDto;

  @ApiPropertyOptional({
    example: "2024-12-31T23:59:59.000Z",
    description: "End date of the recurrence for this task",
  })
  @IsNotEmpty()
  @IsDateString()
  @FieldType("date", true)
  @Validate(TaskRecurrenceEndDateValidConstraint)
  @ValidateIf((o) => o.enableRecurrence === true)
  recurrenceEndDate?: string | Date;

  @ApiPropertyOptional({
    type: LocationDto,
    description: "Location associated with this task",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => LocationDto)
  @FieldType("nested", false, LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({
    type: DoorDto,
    description: "Door associated with this task",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => DoorDto)
  @FieldType("nested", false, DoorDto)
  door?: DoorDto;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({
    example: "Client requested cancellation",
    description: "Reason for cancellation or status change",
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class TaskListDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: "Filter by status",
  })
  @IsOptional()
  @In("status")
  status?: ETaskStatus[];

  @ApiPropertyOptional({
    description: "Filter by priority",
  })
  @IsOptional()
  @In("priority")
  priority?: ETaskPriority[];

  @ApiPropertyOptional({
    description: "Filter by assigned user ID",
  })
  @IsOptional()
  @RelationFilter("assignedTo")
  assignedToUserId?: string;

  @ApiPropertyOptional({
    description: "Filter by due date range",
  })
  @IsOptional()
  @DateRange("dueDate")
  dueDateRange?: string;

  @ApiPropertyOptional({
    description: "Filter by overdue tasks (dueDate < now)",
  })
  @IsOptional()
  @IsString()
  overdue?: string; // "true" or "false"

  @ApiPropertyOptional({
    description: "Filter by tags",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: "Filter by location ID",
  })
  @IsOptional()
  @IsUUID()
  @Equals()
  locationId?: string;
}

export class TaskPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [TaskDto] })
  @Expose()
  @Type(() => TaskDto)
  data: TaskDto[];
}

export class TaskDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Task ID",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "Complete project documentation",
    description: "Task title",
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: "Write comprehensive documentation for the API endpoints",
    description: "Task description",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ETaskStatus,
    example: ETaskStatus.TODO,
    description: "Task status",
  })
  @IsEnum(ETaskStatus)
  status: ETaskStatus;

  @ApiProperty({
    enum: ETaskPriority,
    example: ETaskPriority.MEDIUM,
    description: "Task priority",
  })
  @IsEnum(ETaskPriority)
  priority: ETaskPriority;

  @ApiProperty({
    example: "2024-01-15T09:00:00.000Z",
    description: "Task start date and time",
  })
  @IsDateString()
  startDateTime: string;

  @ApiProperty({
    example: "2024-12-31T23:59:59.000Z",
    description: "Due date for the task",
  })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    type: UserDto,
    description: "User assigned to this task",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => UserDto)
  assignedTo?: UserDto;

  @ApiPropertyOptional({
    type: UserDto,
    description: "User who created this task",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => UserDto)
  createdBy?: UserDto;

  @ApiPropertyOptional({
    example: ["documentation", "api"],
    description: "Tags for categorizing tasks",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: 50,
    description: "Progress percentage (0-100)",
  })
  @IsOptional()
  @IsNumber()
  progress: number;

  @ApiPropertyOptional({
    example: "2024-01-15T10:00:00.000Z",
    description: "Date when task was started",
  })
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional({
    example: "2024-01-20T15:30:00.000Z",
    description: "Date when task was completed",
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether recurrence is enabled for this task",
  })
  @IsOptional()
  enableRecurrence?: boolean;

  @ApiPropertyOptional({
    type: () => RecurrenceConfigDto,
    description: "Recurrence configuration",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => RecurrenceConfigDto)
  recurrenceConfig?: RecurrenceConfigDto;

  @ApiPropertyOptional({
    example: "2024-12-31T23:59:59.000Z",
    description: "End date of the recurrence for this task",
  })
  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;

  @ApiPropertyOptional({
    example: false,
    description: "Whether this is a calendar event (recurring task instance)",
  })
  @IsOptional()
  @IsBoolean()
  isCalendarEvent?: boolean;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Original task ID if this is a calendar event",
  })
  @IsOptional()
  @IsString()
  originalTaskId?: string;

  @ApiPropertyOptional({
    example: "2024-01-15T09:00:00.000Z",
    description: "Event date for calendar events",
  })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({
    example: "Client requested cancellation",
    description: "Reason for cancellation or status change",
  })
  @IsOptional()
  @IsString()
  reason?: string;
}


export class TaskCalendarEventsRequestDto {
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
    example: "TODO",
    description: "Status filter",
  })
  @IsOptional()
  @IsEnum(ETaskStatus, { each: true })
  @FieldType("select", false)
  @TransformToArray()
  statuses?: ETaskStatus[];
}

