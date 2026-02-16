import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType } from "../../decorators/field.decorator";
import { DeviceReaderDto } from "../device-reader-dtos/device-reader.dto";
import { CameraDto } from "../camera-dtos/camera.dto";

export class CreateDoorDto {
  @ApiProperty({
    example: "Main Entrance",
    description: "Door name",
  })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  name: string;

  @ApiProperty({
    example: "Main entrance door to the gym",
    description: "Door description",
  })
  @IsString()
  @IsOptional()
  @FieldType("textarea", false)
  description?: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Location ID that this door belongs to",
  })
  @IsUUID()
  @IsNotEmpty()
  @FieldType("text", true)
  locationId: string;

  @ApiPropertyOptional({
    type: () => DeviceReaderDto,
    description: "Device Reader",
  })
  @IsOptional()
  @Type(() => DeviceReaderDto)
  @ValidateNested()
  @FieldType("custom", false, DeviceReaderDto)
  deviceReader?: DeviceReaderDto;

  @ApiPropertyOptional({
    type: () => CameraDto,
    description: "Camera",
  })
  @IsOptional()
  @Type(() => CameraDto)
  @ValidateNested()
  @FieldType("custom", false, CameraDto)
  camera?: CameraDto;
}

export class UpdateDoorDto extends PartialType(CreateDoorDto) { }

export class DoorListDto extends ListQueryDto {
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ example: "Main Entrance" })
  @IsOptional()
  @IsString()
  name?: string;
}

export class DoorPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [DoorDto] })
  @Type(() => DoorDto)
  data: DoorDto[];
}

export class DoorDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Door ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({ example: "Main Entrance", description: "Door name" })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    example: "Main entrance door to the gym",
    description: "Door description",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Location ID",
  })
  @IsOptional()
  @IsString()
  locationId: string;

  @ApiPropertyOptional({
    type: () => DeviceReaderDto,
    description: "Device Reader",
  })
  @IsOptional()
  @Type(() => DeviceReaderDto)
  @ValidateNested()
  @FieldType("custom", false, DeviceReaderDto)
  deviceReader?: DeviceReaderDto;

  @ApiPropertyOptional({
    type: () => CameraDto,
    description: "Camera",
  })
  @IsOptional()
  @Type(() => CameraDto)
  @ValidateNested()
  @FieldType("custom", false, CameraDto)
  camera?: CameraDto;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}