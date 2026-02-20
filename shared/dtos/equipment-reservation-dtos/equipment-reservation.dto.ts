import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { FieldType } from "../../decorators/field.decorator";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import {
  DateRange,
} from "../../decorators/crud.dto.decorators";
import { EquipmentDto } from "./equipment.dto";

@ValidatorConstraint({ name: "EndDateTimeAfterStartDateTime", async: false })
export class EndDateTimeAfterStartDateTimeConstraint
  implements ValidatorConstraintInterface
{
  validate(endDateTime: any, args: ValidationArguments) {
    const obj = args.object as CreateEquipmentReservationDto;

    if (!endDateTime || !obj.startDateTime) {
      return true; // Let other validators handle required fields
    }

    const startDate = new Date(obj.startDateTime as string);
    const endDate = new Date(endDateTime as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return false;
    }

    return endDate > startDate;
  }

  defaultMessage() {
    return "End date time must be after start date time";
  }
}

export class CreateEquipmentReservationDto {
  @ApiProperty({
    type: EquipmentDto,
    description: "Equipment",
  })
  @IsNotEmpty({ message: "Equipment is required" })
  @FieldType("custom", true)
  equipment: EquipmentDto;

  @ApiProperty({
    example: "2026-01-25T10:00:00.000Z",
    description: "Reservation start date and time",
  })
  @IsDateString()
  @IsNotEmpty({ message: "Start date and time is required" })
  @FieldType("datetime", true)
  startDateTime: string;

  @ApiProperty({
    example: "2026-01-25T11:00:00.000Z",
    description: "Reservation end date and time",
  })
  @IsDateString()
  @IsNotEmpty({ message: "End date and time is required" })
  @Validate(EndDateTimeAfterStartDateTimeConstraint)
  @FieldType("datetime", true)
  endDateTime: string;

  @ApiPropertyOptional({
    example: "Training session",
    description: "Reservation notes or purpose",
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @FieldType("textarea", false)
  notes?: string;
}

export class UpdateEquipmentReservationDto extends PartialType(CreateEquipmentReservationDto) {}

export class EquipmentReservationListDto extends ListQueryDto {



  @ApiPropertyOptional({
    description: "Filter by start date time range",
  })
  @IsOptional()
  @DateRange("startDateTime")
  startDateTimeRange?: string;

  @ApiPropertyOptional({
    description: "Filter by end date time range",
  })
  @IsOptional()
  @DateRange("endDateTime")
  endDateTimeRange?: string;
}

export class EquipmentReservationPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [EquipmentReservationDto] })
  @Expose()
  @Type(() => EquipmentReservationDto)
  data: EquipmentReservationDto[];
}

export class EquipmentReservationDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  equipmentId: string;

  @ApiProperty({ example: "2026-01-25T10:00:00.000Z" })
  startDateTime: Date;

  @ApiProperty({ example: "2026-01-25T11:00:00.000Z" })
  endDateTime: Date;

  @ApiPropertyOptional({ example: "Training session" })
  notes?: string;

  @ApiPropertyOptional({ type: () => EquipmentDto })
  @Expose()
  @Type(() => EquipmentDto)
  equipment?: EquipmentDto;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
