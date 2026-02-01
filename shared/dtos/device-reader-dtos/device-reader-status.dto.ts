import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EDeviceReaderStatus } from "../../enums/device-reader.enum";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";

export class UpdateDeviceReaderStatusDto {
  @ApiProperty({
    example: EDeviceReaderStatus.ACTIVE,
    description: "New device reader status",
    enum: EDeviceReaderStatus,
  })
  @IsNotEmpty()
  @IsEnum(EDeviceReaderStatus)
  @FieldType("select", true)
  @FieldOptions([
    { value: EDeviceReaderStatus.ACTIVE, label: "Active" },
    { value: EDeviceReaderStatus.INACTIVE, label: "Inactive" },
    { value: EDeviceReaderStatus.MAINTENANCE, label: "Maintenance" },
  ])
  status: EDeviceReaderStatus;

  @ApiPropertyOptional({
    example: "Device activated",
    description: "Optional message for the status change",
  })
  @IsOptional()
  @IsString()
  message?: string;
}

