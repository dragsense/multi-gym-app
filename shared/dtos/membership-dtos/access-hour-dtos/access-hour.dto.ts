import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  Matches,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../../common/pagination.dto";
import { ListQueryDto } from "../../common/list-query.dto";
import { FieldType, FieldOptions } from "../../../decorators/field.decorator";
import { TransformToArray } from "../../../decorators/crud.dto.decorators";

@ValidatorConstraint({ name: "endTimeAfterStartTime", async: false })
class EndTimeAfterStartTimeConstraint implements ValidatorConstraintInterface {
  validate(endTime: string, args: ValidationArguments) {
    const object = args.object as CreateAccessHourDto;
    if (!object.startTime || !endTime) {
      return true; // Let other validators handle required fields
    }

    const [startHours, startMinutes] = object.startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    return endTotalMinutes > startTotalMinutes;
  }

  defaultMessage(args: ValidationArguments) {
    return "End time must be after start time";
  }
}

export class CreateAccessHourDto {
  @ApiProperty({ example: "Morning Hours", description: "Access hours name" })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  name: string;




  @ApiProperty({
    example: "06:00",
    description: "Start time in HH:mm format",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Start time must be in HH:mm format",
  })
  @FieldType("time", true)
  startTime: string;

  @ApiProperty({
    example: "12:00",
    description: "End time in HH:mm format",
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "End time must be in HH:mm format",
  })
  @Validate(EndTimeAfterStartTimeConstraint)
  @FieldType("time", true)
  endTime: string;

  @ApiProperty({
    example: ["MONDAY", "TUESDAY", "WEDNESDAY"],
    description: "Days of the week when access is available",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @FieldType("multiSelect", false)
  @FieldOptions([
    { value: "MONDAY", label: "Monday" },
    { value: "TUESDAY", label: "Tuesday" },
    { value: "WEDNESDAY", label: "Wednesday" },
    { value: "THURSDAY", label: "Thursday" },
    { value: "FRIDAY", label: "Friday" },
    { value: "SATURDAY", label: "Saturday" },
    { value: "SUNDAY", label: "Sunday" },
  ])
  @TransformToArray()
  daysOfWeek?: string[];
}

export class UpdateAccessHourDto extends PartialType(CreateAccessHourDto) {}

export class AccessHourListDto extends ListQueryDto {

}

export class AccessHourPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [AccessHourDto] })
  @Type(() => AccessHourDto)
  data: AccessHourDto[];
}

export class AccessHourDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Access hour ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({ example: "Morning Hours", description: "Access hours name" })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    example: "Morning access hours from 6 AM to 12 PM",
    description: "Access hours description",
  })
  @IsOptional()
  @IsString()
  description?: string;


  @ApiProperty({
    example: "06:00",
    description: "Start time in HH:mm format",
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({
    example: "12:00",
    description: "End time in HH:mm format",
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({
    example: ["MONDAY", "TUESDAY", "WEDNESDAY"],
    description: "Days of the week when access is available",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  daysOfWeek?: string[];

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

