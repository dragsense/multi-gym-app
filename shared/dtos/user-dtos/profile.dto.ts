import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsDate,
  IsEnum,
  Min,
  IsDateString,
  IsNotEmpty,
  ValidateNested,
  ArrayMaxSize,
} from "class-validator";
import { EUserGender } from "../../enums/user.enum";
import { FieldOptions, FieldType } from "../../decorators/field.decorator";
import { FileUploadDto } from "../file-upload-dtos";

export class CreateProfileDto {
  @ApiPropertyOptional({ example: "+1234567890" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  phoneNumber?: string;

  @ApiProperty({ example: "123 Main Street, New York" })
  @IsOptional()
  @IsString()
  @FieldType("textarea")
  address?: string;

  @ApiPropertyOptional({ example: "RFID123456789" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  rfid?: string;

  @ApiPropertyOptional({ example: "John Doe" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: "+1234567890" })
  @IsOptional()
  @IsString()
  @FieldType("tel")
  emergencyContactNumber?: string;

  @ApiPropertyOptional({ example: "Spouse" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  emergencyContactRelationship?: string;

  @ApiPropertyOptional({ example: "+1234567890" })
  @IsOptional()
  @IsString()
  @FieldType("tel")
  alternativeEmergencyContactNumber?: string;

  @ApiPropertyOptional({ example: "New York" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  city?: string;

  @ApiPropertyOptional({ example: "NY" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  state?: string;

  @ApiPropertyOptional({ example: "10001" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  zipCode?: string;

  @ApiPropertyOptional({ example: "United States" })
  @IsOptional()
  @IsString()
  @FieldType("text")
  country?: string;

  @ApiPropertyOptional({
    type: "string",
    format: "binary",
    required: false,
    description: "Image file",
  })
  @IsOptional()
  @FieldType("custom")
  image?: any;

  @ApiPropertyOptional({
    type: "array",
    items: { type: "string", format: "binary" },
    required: false,
    description: "Document files (max 10)",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @FieldType("custom")
  documents?: any[];
}

export class UpdateProfileDto extends PartialType(CreateProfileDto) {
  @ApiPropertyOptional({
    type: [String],
    example: ["550e8400-e29b-41d4-a716-446655440000"],
    description: "Array of document IDs to remove",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedDocumentIds?: string[];
}

export class ProfileDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "John" })
  firstName: string;

  @ApiProperty({ example: "Doe" })
  lastName: string;

  @ApiProperty({ example: "+1234567890" })
  phoneNumber?: string;

  @ApiProperty({ example: "1990-01-01" })
  dateOfBirth?: string;

  @ApiProperty({ enum: EUserGender, example: EUserGender.MALE })
  gender?: EUserGender;

  @ApiProperty({ example: "123 Main Street, New York" })
  address?: string;

  @ApiPropertyOptional({ example: "RFID123456789" })
  rfid?: string;

  @ApiPropertyOptional({ example: "John Doe" })
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: "+1234567890" })
  emergencyContactNumber?: string;

  @ApiPropertyOptional({ example: "Spouse" })
  emergencyContactRelationship?: string;

  @ApiPropertyOptional({ example: "+1234567890" })
  alternativeEmergencyContactNumber?: string;

  @ApiPropertyOptional({ example: "New York" })
  city?: string;

  @ApiPropertyOptional({ example: "NY" })
  state?: string;

  @ApiPropertyOptional({ example: "10001" })
  zipCode?: string;

  @ApiPropertyOptional({ example: "United States" })
  country?: string;

  @ApiProperty({ type: FileUploadDto })
  image?: FileUploadDto;

  @ApiProperty({ type: [FileUploadDto] })
  documents?: FileUploadDto[];
}
