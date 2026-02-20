import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  ValidateNested,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import {
  Between,
  LessThan,
  GreaterThan,
  LessThanOrEqual,
  GreaterThanOrEqual,
  Like,
  In,
  NotIn,
  IsNull,
  IsNotNull,
  Equals,
  NotEquals,
  DateRange,
  TransformToDate,
  RelationFilter,
} from "../../decorators/crud.dto.decorators";
import { getTimezoneOptionsWithSystem } from "../../constants/timezone.constants";
import { UserDto } from "../user-dtos";
import { LocationDto } from "../location-dtos/location.dto";
import { DoorDto } from "../location-dtos/door.dto";
import { CheckinSnapshotDto } from "./checkin-snapshot.dto";


@ValidatorConstraint({ name: "CheckoutTimeAfterCheckinTime", async: false })
export class CheckoutTimeAfterCheckinTimeConstraint
  implements ValidatorConstraintInterface {
  validate(checkOutTime: string | undefined, args: ValidationArguments) {
    const object = args.object as CreateCheckinDto | UpdateCheckinDto;

    // If checkout time is not provided, skip validation (it's optional)
    if (!checkOutTime) {
      return true;
    }

    // For UpdateCheckinDto, we need to check if checkInTime exists
    // If checkInTime is not provided in update, we'll validate in service
    if (!object.checkInTime) {
      return true; // Let service handle this case
    }

    const checkInDate = new Date(object.checkInTime);
    const checkOutDate = new Date(checkOutTime);

    // Checkout time must be after checkin time
    return checkOutDate > checkInDate;
  }

  defaultMessage(args: ValidationArguments) {
    return "Checkout time must be after check-in time";
  }
}

export class CreateCheckinDto {
  @ApiProperty({ type: UserDto })
  @IsNotEmpty({ message: "User is required" })
  @ValidateNested()
  @Expose()
  @Type(() => UserDto)
  @FieldType("nested", true, UserDto)
  user: UserDto;

  @ApiProperty({
    example: "2024-01-15T08:30:00.000Z",
    description: "Check-in timestamp",
  })
  @IsNotEmpty()
  @FieldType("datetime", true)
  @TransformToDate()
  checkInTime: string | Date;

  @ApiPropertyOptional({
    example: "2024-01-15T10:45:00.000Z",
    description: "Check-out timestamp",
  })
  @IsOptional()
  @Validate(CheckoutTimeAfterCheckinTimeConstraint)
  @FieldType("datetime", false)
  @TransformToDate()
  checkOutTime?: string | Date;

  @ApiPropertyOptional({
    type: LocationDto,
    description: "Location where check-in occurred",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => LocationDto)
  @FieldType("nested", false, LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({
    type: DoorDto,
    description: "Door where check-in occurred",
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => DoorDto)
  @FieldType("nested", false, DoorDto)
  door?: DoorDto;

 

  @ApiPropertyOptional({
    example: "RFID-12345",
    description: "Device ID used for check-in",
  })
  @IsOptional()
  @IsString()
  @FieldType("text", false)
  deviceId?: string;

  @ApiPropertyOptional({
    example: "America/New_York",
    description: "Timezone (IANA timezone identifier)",
  })
  @IsOptional()
  @IsString()
  @FieldType("select", false)
  @FieldOptions(
    getTimezoneOptionsWithSystem().map((tz) => ({
      value: tz.value,
      label: tz.label,
    }))
  )
  timezone?: string;

  @ApiPropertyOptional({
    example: "Notes about the check-in",
    description: "Additional notes or comments",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea", false)
  notes?: string;
}

export class UpdateCheckinDto extends PartialType(CreateCheckinDto) { }

export class CheckinListDto extends ListQueryDto {
  @ApiPropertyOptional({
    description: "Filter by user ID",
  })
  @IsOptional()
  @RelationFilter("user")
  userId?: string;

  @ApiPropertyOptional({
    description: "Filter by check-in date range",
  })
  @IsOptional()
  @DateRange("checkInTime")
  checkInTimeRange?: string;

  @ApiPropertyOptional({
    description: "Filter by check-out date range",
  })
  @IsOptional()
  @DateRange("checkOutTime")
  checkOutTimeRange?: string;

  @ApiPropertyOptional({
    description: "Filter by location ID",
  })
  @IsOptional()
  @IsUUID()
  @Equals()
  locationId?: string;


  @ApiPropertyOptional({
    description: "Filter by checked out status (true = has checkOutTime, false = no checkOutTime)",
  })
  @IsOptional()
  @IsString()
  checkedOut?: string;
}

export class CheckinPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [CheckinDto] })
  @Expose()
  @Type(() => CheckinDto)
  data: CheckinDto[];
}

export class CheckinDto {


  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Checkin ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({ type: UserDto })
  @ValidateNested()
  @Expose()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty({
    example: "2024-01-15T08:30:00.000Z",
    description: "Check-in timestamp",
  })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({
    example: "2024-01-15T10:45:00.000Z",
    description: "Check-out timestamp",
  })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiPropertyOptional({
    example: "Main Entrance - RFID Scanner",
    description: "Location or device where check-in occurred",
  })
  @IsOptional()
  @IsString()
  @Expose()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiPropertyOptional({
    type: DoorDto,
    description: "Door where check-in occurred",
  })
  @IsOptional()
  @Expose()
  @Type(() => DoorDto)
  door?: DoorDto;

  @ApiPropertyOptional({
    example: "RFID-12345",
    description: "Device ID used for check-in",
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({
    example: "America/New_York",
    description: "Timezone (IANA timezone identifier)",
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    example: "Notes about the check-in",
    description: "Additional notes or comments",
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: "Snapshots captured during check-in",
    type: () => [CheckinSnapshotDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => CheckinSnapshotDto)
  snapshots?: CheckinSnapshotDto[];

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}


