import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType } from "../../decorators/field.decorator";
import { FileUploadDto } from "../file-upload-dtos/file-upload.dto";

export class CreateBannerImageDto {
  @ApiProperty({
    example: "Summer Sale Banner",
    description: "Banner image name",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  name: string;

  @ApiProperty({
    type: "string",
    format: "binary",
    required: true,
    description: "Image file",
  })
  @IsNotEmpty()
  @FieldType("file", true)
  image: any;
}

export class UpdateBannerImageDto extends PartialType(CreateBannerImageDto) {}

export class BannerImagePaginationDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [BannerImageDto] })
  @Type(() => BannerImageDto)
  data: BannerImageDto[];
}

export class BannerImageListDto extends ListQueryDto {
  @ApiPropertyOptional({ example: "Summer Sale" })
  @IsOptional()
  @IsString()
  name?: string;
}

export class BannerImageDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsUUID()
  id: string;

  @ApiProperty({ example: "Summer Sale Banner" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: FileUploadDto })
  @IsOptional()
  image?: FileUploadDto;

  @IsOptional()
  createdAt?: string;

  @IsOptional()
  updatedAt?: string;
}

