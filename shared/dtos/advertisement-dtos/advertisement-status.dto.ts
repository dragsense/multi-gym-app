import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EAdvertisementStatus } from "../../enums/advertisement.enum";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";

export class UpdateAdvertisementStatusDto {
  @ApiProperty({
    example: EAdvertisementStatus.ACTIVE,
    description: "New advertisement status",
    enum: EAdvertisementStatus,
  })
  @IsNotEmpty()
  @IsEnum(EAdvertisementStatus)
  @FieldType("select", true)
  @FieldOptions([
    { value: EAdvertisementStatus.DRAFT, label: "Draft" },
    { value: EAdvertisementStatus.ACTIVE, label: "Active" },
    { value: EAdvertisementStatus.INACTIVE, label: "Inactive" },
    { value: EAdvertisementStatus.EXPIRED, label: "Expired" },
  ])
  status: EAdvertisementStatus;

  @ApiPropertyOptional({
    example: "Activated for summer campaign",
    description: "Optional message for the status change",
  })
  @IsOptional()
  @IsString()
  message?: string;
}

