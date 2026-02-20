import {
  IsNotEmpty,
  IsEnum,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  ValidateIf,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Transform, Expose } from "class-transformer";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { EScheduleFrequency, EDayOfWeek } from "../../enums/schedule.enum";

// Custom validator to ensure weekDays are only shown for WEEKLY frequency
@ValidatorConstraint({ name: "weekDaysRequiredForWeekly", async: false })
export class WeekDaysRequiredForWeeklyConstraint
  implements ValidatorConstraintInterface
{
  validate(weekDays: any, args: ValidationArguments) {
    const obj = args.object as RecurrenceConfigDto;
    if (obj.frequency === EScheduleFrequency.WEEKLY) {
      return Array.isArray(weekDays) && weekDays.length > 0;
    }
    return true; // Not required for other frequencies
  }

  defaultMessage(args: ValidationArguments) {
    return "Week days are required when frequency is weekly";
  }
}

// Custom validator to ensure monthDays are only shown for MONTHLY frequency
@ValidatorConstraint({ name: "monthDaysRequiredForMonthly", async: false })
export class MonthDaysRequiredForMonthlyConstraint
  implements ValidatorConstraintInterface
{
  validate(monthDays: any, args: ValidationArguments) {
    const obj = args.object as RecurrenceConfigDto;
    if (obj.frequency === EScheduleFrequency.MONTHLY) {
      return Array.isArray(monthDays) && monthDays.length > 0;
    }
    return true; // Not required for other frequencies
  }

  defaultMessage(args: ValidationArguments) {
    return "Month days are required when frequency is monthly";
  }
}

export class RecurrenceConfigDto {
  @ApiProperty({
    example: EScheduleFrequency.WEEKLY,
    description: "Recurrence frequency",
    enum: EScheduleFrequency,
  })
  @IsEnum(EScheduleFrequency)
  @IsNotEmpty()
  @FieldType("select")
  @FieldOptions(
    Object.values(EScheduleFrequency).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  frequency: EScheduleFrequency;

  @ApiPropertyOptional({
    example: [1, 3, 5],
    description:
      "Days of week for WEEKLY recurrence (0=Sunday, 1=Monday, ..., 6=Saturday)",
    type: [Number],
  })
  @IsArray()
  @IsEnum(EDayOfWeek, { each: true })
  @Expose()
  @Type(() => Number)
  @ValidateIf((o) => o.frequency === EScheduleFrequency.WEEKLY)
  @Validate(WeekDaysRequiredForWeeklyConstraint)
  @FieldType("multiSelect")
  @FieldOptions([
    { value: EDayOfWeek.SUNDAY.toString(), label: "Sunday" },
    { value: EDayOfWeek.MONDAY.toString(), label: "Monday" },
    { value: EDayOfWeek.TUESDAY.toString(), label: "Tuesday" },
    { value: EDayOfWeek.WEDNESDAY.toString(), label: "Wednesday" },
    { value: EDayOfWeek.THURSDAY.toString(), label: "Thursday" },
    { value: EDayOfWeek.FRIDAY.toString(), label: "Friday" },
    { value: EDayOfWeek.SATURDAY.toString(), label: "Saturday" },
  ])
  weekDays?: EDayOfWeek[];

  @ApiPropertyOptional({
    example: [1, 15],
    description: "Days of month for MONTHLY recurrence (1-31)",
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  @Expose()
  @Type(() => Number)
  @ValidateIf((o) => o.frequency === EScheduleFrequency.MONTHLY)
  @Validate(MonthDaysRequiredForMonthlyConstraint)
  @FieldType("multiSelect")
  @FieldOptions(
    Array.from({ length: 31 }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString(),
    }))
  )
  monthDays?: number[];
}
