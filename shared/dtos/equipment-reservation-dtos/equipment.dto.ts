import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  MaxLength,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import {
  Equals,
  RelationFilter,
} from "../../decorators/crud.dto.decorators";
import { EquipmentTypeDto } from "./equipment-type.dto";
import { EEquipmentStatus } from "../../enums/equipment.enum";

export class CreateEquipmentDto {


  @ApiProperty({ example: "Treadmill #1", description: "Equipment name/identifier" })
  @IsString()
  @IsNotEmpty({ message: "Name is required" })
  @MaxLength(255)
  @FieldType("text", true)
  name: string;

  @ApiPropertyOptional({
    example: "Main floor, near entrance",
    description: "Equipment location or description",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea", false)
  description?: string;

  @ApiPropertyOptional({
    example: "EQ-001",
    description: "Equipment serial number or code",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @FieldType("text", false)
  serialNumber?: string;

  @ApiPropertyOptional({
    example: EEquipmentStatus.AVAILABLE,
    description: "Equipment status",
    enum: EEquipmentStatus,
    default: EEquipmentStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(EEquipmentStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: EEquipmentStatus.MAINTENANCE, label: "Maintenance" },
    { value: EEquipmentStatus.AVAILABLE, label: "Available" },
    { value: EEquipmentStatus.NOT_AVAILABLE, label: "Not Available" },
  ])
  status?: EEquipmentStatus;

  @ApiProperty({
    type: EquipmentTypeDto,
    description: "Equipment type",
  })
  @IsNotEmpty({ message: "Equipment type is required" })
  @FieldType("custom", true)
  equipmentType: EquipmentTypeDto;
}

export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}

export class EquipmentListDto extends ListQueryDto {
 
  @ApiPropertyOptional({
    example: EEquipmentStatus.AVAILABLE,
    description: "Filter by equipment status",
    enum: EEquipmentStatus,
  })
  @IsOptional()
  @IsEnum(EEquipmentStatus)
  @Equals()
  @FieldType("select", false)
  @FieldOptions([
    { value: EEquipmentStatus.MAINTENANCE, label: "Maintenance" },
    { value: EEquipmentStatus.AVAILABLE, label: "Available" },
    { value: EEquipmentStatus.NOT_AVAILABLE, label: "Not Available" },
  ])
  status?: EEquipmentStatus;
}

export class EquipmentPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [EquipmentDto] })
  @Type(() => EquipmentDto)
  data: EquipmentDto[];
}

export class EquipmentDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  equipmentTypeId: string;

  @ApiProperty({ example: "Treadmill #1" })
  name: string;

  @ApiPropertyOptional({ example: "Main floor, near entrance" })
  description?: string;

  @ApiPropertyOptional({ example: "EQ-001" })
  serialNumber?: string;

  @ApiPropertyOptional({ 
    example: EEquipmentStatus.AVAILABLE,
    enum: EEquipmentStatus,
  })
  status?: EEquipmentStatus;

  @ApiPropertyOptional({ type: () => EquipmentTypeDto })
  @Type(() => EquipmentTypeDto)
  equipmentType?: EquipmentTypeDto;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
