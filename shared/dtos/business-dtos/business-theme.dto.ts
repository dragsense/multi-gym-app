import {
  IsString,
  IsOptional,
  IsUUID,
  Matches,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { FieldType } from "../../decorators/field.decorator";
import type { IFileUpload } from "../../interfaces/file-upload.interface";

export class CreateBusinessThemeDto {
  @ApiProperty({
    example: "#3b82f6",
    description: "Primary color for light theme",
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Primary color must be a valid hex color code",
  })
  @FieldType("color")
  primaryColorLight?: string;

  @ApiProperty({
    example: "#60a5fa",
    description: "Primary color for dark theme",
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Primary color must be a valid hex color code",
  })
  @FieldType("color")
  primaryColorDark?: string;

  @ApiPropertyOptional({
    example: "Poppins",
    description: "Font family name",
  })
  @IsOptional()
  @IsString()
  @FieldType("select")
  fontFamily?: string;

  @ApiPropertyOptional({
    example: "https://fonts.googleapis.com/css2?family=Poppins:...",
    description: "Font URL",
  })
  @IsOptional()
  @IsString()
  @FieldType("text")
  fontUrl?: string;

  @ApiPropertyOptional({
    description: "Logo file ID for light theme",
  })
  @IsOptional()
  @FieldType("file")
  logoLight?: any

  @ApiPropertyOptional({
    description: "Logo file ID for dark theme",
  })
  @IsOptional()
  @FieldType("file")
  logoDark?: any;

  @ApiPropertyOptional({
    description: "Favicon file ID",
  })
  @IsOptional()
  @FieldType("file")
  favicon?: any;

  @ApiPropertyOptional({
    example: "My Business",
    description: "Business title/brand name",
  })
  @IsOptional()
  @IsString()
  @FieldType("text")
  title?: string;
}

export class UpdateBusinessThemeDto extends PartialType(CreateBusinessThemeDto) {}


export class BusinessThemeDto {

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Business theme ID",
  })
  @IsUUID()
  @FieldType("text")
  id: string;

  @ApiPropertyOptional({
    example: "My Business",
    description: "Business title/brand name",
  })
  @IsOptional()
  @IsString()
  @FieldType("text")
  title?: string;

  @ApiPropertyOptional({
    example: "Poppins",
    description: "Font family name",
  })
  @IsOptional()
  @IsString()
  @FieldType("select")
  fontFamily?: string;

  @ApiPropertyOptional({
    example: "https://fonts.googleapis.com/css2?family=Poppins:...",
    description: "Font URL",
  })
  @IsOptional()
  @IsString()
  @FieldType("text")
  fontUrl?: string;

  @ApiPropertyOptional({
    description: "Logo file for light theme",
  })
  @IsOptional()
  @FieldType("file")
  logoLight?: IFileUpload;

  @ApiPropertyOptional({
    description: "Logo file for dark theme",
  })
  @IsOptional()
  @FieldType("file")
  logoDark?: IFileUpload;

  @ApiPropertyOptional({
    description: "Favicon file",
  })
  @IsOptional()
  @FieldType("file")
  favicon?: IFileUpload;

  @ApiPropertyOptional({
    example: "oklch(0.5 0.2 25.41)",
    description: "Primary color for light theme",
  })
  @IsOptional()
  @IsString()
  @FieldType("color")
  primaryColorLight?: string;

  @ApiPropertyOptional({
    example: "oklch(0.92 0 286.61)",
    description: "Primary color for dark theme",
  })
  @IsOptional()
  @IsString()
  @FieldType("color")
  primaryColorDark?: string;

}