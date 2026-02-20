import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { FieldType } from "../../decorators/field.decorator";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { Type, Expose } from "class-transformer";

export class CreateEquipmentTypeDto {
  @ApiProperty({ example: "Treadmill", description: "Equipment type name" })
  @IsString()
  @IsNotEmpty({ message: "Name is required" })
  @MaxLength(255)
  @FieldType("text", true)
  name: string;

  @ApiPropertyOptional({
    example: "Cardio equipment for running",
    description: "Equipment type description",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea", false)
  description?: string;
}

export class UpdateEquipmentTypeDto extends PartialType(CreateEquipmentTypeDto) {}

export class EquipmentTypeListDto extends ListQueryDto {
}

export class EquipmentTypePaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [EquipmentTypeDto] })
  @Expose()
  @Type(() => EquipmentTypeDto)
  data: EquipmentTypeDto[];
}

export class EquipmentTypeDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "Treadmill" })
  name: string;

  @ApiPropertyOptional({ example: "Cardio equipment for running" })
  description?: string;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  updatedAt?: Date;
}
