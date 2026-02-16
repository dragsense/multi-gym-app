import {
  IsString,
  IsNotEmpty,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType } from "../../decorators/field.decorator";
import { FileUploadDto } from "../file-upload-dtos/file-upload.dto";

export class CreateLocationDto {
  @ApiProperty({
    example: "Main Gym",
    description: "Location name",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  name: string;

  @ApiProperty({
    example: "123 Main St, City, State 12345",
    description: "Location address",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  address: string;

  @ApiProperty({
    type: "string",
    format: "binary",
    required: false,
    description: "Location image file",
  })
  @IsOptional()
  @FieldType("file", false)
  image?: any;
}

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}

export class LocationPaginationDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [LocationDto] })
  @Type(() => LocationDto)
  data: LocationDto[];
}

export class LocationListDto extends ListQueryDto {
  @ApiPropertyOptional({ example: "Main Gym" })
  @IsOptional()
  @IsString()
  name?: string;
}

export class LocationDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  id: string;

  @ApiProperty({ example: "Main Gym" })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  name: string;

  @ApiProperty({ example: "123 Main St, City, State 12345" })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ type: FileUploadDto })
  @IsOptional()
  image?: FileUploadDto;

  @IsOptional()
  createdAt?: string;

  @IsOptional()
  updatedAt?: string;
}

