import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsEmail,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { EFacilityInfoStatus } from "../../enums/facility-info.enum";

export class CreateFacilityInfoDto {
  @ApiProperty({
    example: "info@example.com",
    description: "Facility email",
  })
  @IsNotEmpty()
  @IsEmail()
  @FieldType("email", true)
  email: string;

  @ApiProperty({
    example: "+1234567890",
    description: "Facility phone",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  phone: string;

  @ApiProperty({
    example: "123 Main St, City, State 12345",
    description: "Facility address",
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", true)
  address: string;

  @ApiPropertyOptional({
    enum: EFacilityInfoStatus,
    example: EFacilityInfoStatus.ACTIVE,
    description: "Facility status",
  })
  @IsOptional()
  @IsEnum(EFacilityInfoStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: EFacilityInfoStatus.ACTIVE, label: "Active" },
    { value: EFacilityInfoStatus.INACTIVE, label: "Inactive" },
  ])
  status?: EFacilityInfoStatus;
}

export class UpdateFacilityInfoDto extends PartialType(CreateFacilityInfoDto) {}

export * from "./facility-info-status.dto";

export class FacilityInfoPaginationDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [FacilityInfoDto] })
  @Type(() => FacilityInfoDto)
  data: FacilityInfoDto[];
}

export class FacilityInfoListDto extends ListQueryDto {
  @ApiPropertyOptional({ example: "info@example.com" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: EFacilityInfoStatus })
  @IsOptional()
  @IsEnum(EFacilityInfoStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: EFacilityInfoStatus.ACTIVE, label: "Active" },
    { value: EFacilityInfoStatus.INACTIVE, label: "Inactive" },
  ])
  status?: EFacilityInfoStatus;
}

export class FacilityInfoDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id: string;

  @ApiProperty({ example: "info@example.com" })
  email: string;

  @ApiProperty({ example: "+1234567890" })
  phone: string;

  @ApiProperty({ example: "123 Main St, City, State 12345" })
  address: string;

  @ApiProperty({ enum: EFacilityInfoStatus, example: EFacilityInfoStatus.ACTIVE })
  status: EFacilityInfoStatus;

  createdAt: string;
  updatedAt: string;
}

