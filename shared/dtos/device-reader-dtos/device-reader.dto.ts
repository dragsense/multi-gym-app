import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { EDeviceReaderStatus } from "../../enums/device-reader.enum";
import { LocationDto } from "../location-dtos/location.dto";
import { ValidateNested } from "class-validator";
import { Equals } from "../../decorators/crud.dto.decorators";

export class CreateDeviceReaderDto {
  @ApiProperty({
    example: "RFID Reader 001",
    description: "Device name",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  deviceName: string;

  @ApiProperty({
    example: "00:1B:44:11:3A:B7",
    description: "MAC address",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  macAddress: string;

  @ApiPropertyOptional({
    enum: EDeviceReaderStatus,
    example: EDeviceReaderStatus.ACTIVE,
    description: "Device status",
  })
  @IsOptional()
  @IsEnum(EDeviceReaderStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: EDeviceReaderStatus.ACTIVE, label: "Active" },
    { value: EDeviceReaderStatus.INACTIVE, label: "Inactive" },
    { value: EDeviceReaderStatus.MAINTENANCE, label: "Maintenance" },
  ])
  status?: EDeviceReaderStatus;

  @ApiProperty({
    type: LocationDto,
    description: "Location that this device reader belongs to",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  @FieldType("nested", true, LocationDto)
  location: LocationDto;
}

export class UpdateDeviceReaderDto extends PartialType(CreateDeviceReaderDto) {}

export * from "./device-reader-status.dto";

export class DeviceReaderPaginationDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [DeviceReaderDto] })
  @Type(() => DeviceReaderDto)
  data: DeviceReaderDto[];
}

export class DeviceReaderListDto extends ListQueryDto {
  @ApiPropertyOptional({ example: "RFID Reader 001" })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({
    description: "Filter by location ID",
  })
  @IsOptional()
  @IsString()
  @Equals()
  locationId?: string;

  @ApiPropertyOptional({ enum: EDeviceReaderStatus })
  @IsOptional()
  @IsEnum(EDeviceReaderStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: EDeviceReaderStatus.ACTIVE, label: "Active" },
    { value: EDeviceReaderStatus.INACTIVE, label: "Inactive" },
    { value: EDeviceReaderStatus.MAINTENANCE, label: "Maintenance" },
  ])
  status?: EDeviceReaderStatus;
}

export class DeviceReaderDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({ example: "RFID Reader 001" })
  @IsString()
  @IsOptional()
  deviceName?: string;

  @ApiProperty({ example: "00:1B:44:11:3A:B7" })
  @IsOptional()
  @IsString()
  macAddress?: string;

  @ApiProperty({ enum: EDeviceReaderStatus, example: EDeviceReaderStatus.ACTIVE })
  @IsOptional()
  status: EDeviceReaderStatus;

  @ApiProperty({
    type: LocationDto,
    description: "Location that this device reader belongs to",
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  createdAt?: string;

  @IsOptional()
  updatedAt?: string;
}

