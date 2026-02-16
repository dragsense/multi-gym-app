import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ETrainerServiceStatus } from "../../enums/trainer-service.enum";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";

export class UpdateTrainerServiceStatusDto {
  @ApiProperty({
    example: ETrainerServiceStatus.ACTIVE,
    description: "New trainer service status",
    enum: ETrainerServiceStatus,
  })
  @IsNotEmpty()
  @IsEnum(ETrainerServiceStatus)
  @FieldType("select", true)
  @FieldOptions([
    { value: ETrainerServiceStatus.ACTIVE, label: "Active" },
    { value: ETrainerServiceStatus.INACTIVE, label: "Inactive" },
  ])
  status: ETrainerServiceStatus;

  @ApiPropertyOptional({
    example: "Service activated",
    description: "Optional message for the status change",
  })
  @IsOptional()
  @IsString()
  message?: string;
}

