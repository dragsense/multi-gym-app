import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsNotEmpty,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { EFileType } from "../../enums/file-upload.enum";
import { ListQueryDto } from "../common/list-query.dto";
import { PaginationMetaDto } from "../common/pagination.dto";
import type { IFileUpload } from "../../interfaces";
import { FieldOptions, FieldType } from "../../decorators/field.decorator";

export class CreateFileUploadDto {
  @ApiProperty({ example: "profile-picture.jpg" })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  name: string;

  @ApiPropertyOptional({ example: "general" })
  @IsString()
  @IsOptional()
  @FieldType("text")
  folder?: string;

  @ApiProperty({ example: EFileType.IMAGE, enum: EFileType })
  @IsEnum(EFileType)
  @FieldType("select")
  @FieldOptions(
    Object.values(EFileType).map((v) => ({
      value: v,
      label: v.charAt(0) + v.slice(1).toLowerCase(),
    }))
  )
  type: EFileType;

  @ApiPropertyOptional({
    example: "http://localhost:3001/uploads/profile/123.jpg",
  })
  @IsString()
  @IsOptional()
  @FieldType("text")
  url?: string;

  @ApiPropertyOptional({
    example: "image",
    description: "Relation property this file belongs to",
  })
  @IsString()
  @IsOptional()
  @FieldType("text")
  relation?: string;

  @ApiPropertyOptional({
    type: "string",
    format: "binary",
    required: false,
    description: "File",
  })
  @IsNotEmpty()
  @FieldType("file", true)
  file?: any;
}

export class UpdateFileUploadDto extends PartialType(CreateFileUploadDto) {}

export class FilePaginationDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [FileUploadDto] })
  @Expose()
  @Type(() => FileUploadDto)
  data: FileUploadDto[];
}

export class FileListDto extends ListQueryDto<IFileUpload> {
  @ApiPropertyOptional({ enum: EFileType })
  @IsOptional()
  @IsEnum(EFileType)
  @FieldType("select")
  @FieldOptions(
    Object.values(EFileType).map((v) => ({
      value: v,
      label: v.charAt(0) + v.slice(1).toLowerCase(),
    }))
  )
  type?: EFileType;

  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class FileUploadDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "profile-picture.jpg" })
  name: string;

  @ApiProperty({ example: "profile-picture.jpg" })
  originalName: string;

  @ApiProperty({ example: "image/jpeg" })
  mimeType: string;

  @ApiProperty({ example: EFileType.IMAGE })
  type: EFileType;

  @ApiProperty({ example: 1024000 })
  size: number;

  @ApiProperty({ example: "general" })
  folder: string;

  @ApiProperty({
    example: "uploads/general/1234567890-file.jpg",
  })
  path: string;

  @ApiProperty({
    example: "http://localhost:3001/uploads/general/1234567890-file.jpg",
  })
  url: string;

  createdAt: string;
  updatedAt: string;
}
