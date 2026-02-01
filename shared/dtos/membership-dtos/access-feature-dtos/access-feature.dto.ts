import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../../common/pagination.dto";
import { ListQueryDto } from "../../common/list-query.dto";
import { FieldType } from "../../../decorators/field.decorator";

export class CreateAccessFeatureDto {
  @ApiProperty({ example: "Gym Access", description: "Access feature name" })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  name: string;

  @ApiProperty({
    example: "Full access to gym facilities",
    description: "Access feature description",
  })
  @IsString()
  @IsOptional()
  @FieldType("textarea", false)
  description?: string;
}

export class UpdateAccessFeatureDto extends PartialType(CreateAccessFeatureDto) {}

export class AccessFeatureListDto extends ListQueryDto {

}

export class AccessFeaturePaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [AccessFeatureDto] })
  @Type(() => AccessFeatureDto)
  data: AccessFeatureDto[];
}

export class AccessFeatureDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Access feature ID",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({ example: "Gym Access", description: "Access feature name" })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    example: "Full access to gym facilities",
    description: "Access feature description",
  })
  @IsOptional()
  @IsString()
  description?: string;


  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

