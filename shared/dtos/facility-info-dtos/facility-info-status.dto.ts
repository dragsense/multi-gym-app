import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EFacilityInfoStatus } from "../../enums/facility-info.enum";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";

export class UpdateFacilityInfoStatusDto {
  @ApiProperty({
    example: EFacilityInfoStatus.ACTIVE,
    description: "New facility info status",
    enum: EFacilityInfoStatus,
  })
  @IsNotEmpty()
  @IsEnum(EFacilityInfoStatus)
  @FieldType("select", true)
  @FieldOptions([
    { value: EFacilityInfoStatus.ACTIVE, label: "Active" },
    { value: EFacilityInfoStatus.INACTIVE, label: "Inactive" },
  ])
  status: EFacilityInfoStatus;

  @ApiPropertyOptional({
    example: "Facility activated",
    description: "Optional message for the status change",
  })
  @IsOptional()
  @IsString()
  message?: string;
}

