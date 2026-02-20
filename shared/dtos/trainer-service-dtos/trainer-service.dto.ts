import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { ETrainerServiceStatus } from "../../enums/trainer-service.enum";

export class CreateTrainerServiceDto {
  @ApiProperty({
    example: "Personal Training",
    description: "Service title",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  title: string;

  @ApiPropertyOptional({
    example: "One-on-one personal training sessions",
    description: "Service description",
  })
  @IsOptional()
  @IsString()
  @FieldType("textarea", false)
  description?: string;

  @ApiPropertyOptional({
    enum: ETrainerServiceStatus,
    example: ETrainerServiceStatus.ACTIVE,
    description: "Service status",
  })
  @IsOptional()
  @IsEnum(ETrainerServiceStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: ETrainerServiceStatus.ACTIVE, label: "Active" },
    { value: ETrainerServiceStatus.INACTIVE, label: "Inactive" },
  ])
  status?: ETrainerServiceStatus;
}

export class UpdateTrainerServiceDto extends PartialType(CreateTrainerServiceDto) {}

export * from "./trainer-service-status.dto";

export class TrainerServicePaginationDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [TrainerServiceDto] })
  @Expose()
  @Type(() => TrainerServiceDto)
  data: TrainerServiceDto[];
}

export class TrainerServiceListDto extends ListQueryDto {
  @ApiPropertyOptional({ example: "Personal Training" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: ETrainerServiceStatus })
  @IsOptional()
  @IsEnum(ETrainerServiceStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: ETrainerServiceStatus.ACTIVE, label: "Active" },
    { value: ETrainerServiceStatus.INACTIVE, label: "Inactive" },
  ])
  status?: ETrainerServiceStatus;
}

export class TrainerServiceDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsUUID()
  id: string;

  @ApiProperty({ example: "Personal Training" })
  @IsOptional()
  title: string;

  @ApiPropertyOptional({ example: "One-on-one personal training sessions" })
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ETrainerServiceStatus, example: ETrainerServiceStatus.ACTIVE })
  @IsOptional()
  status: ETrainerServiceStatus;

  @IsOptional()
  createdAt: string;

  @IsOptional()
  updatedAt: string;
}

