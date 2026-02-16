import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EServiceOfferStatus } from "../../enums/service-offer.enum";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";

export class UpdateServiceOfferStatusDto {
  @ApiProperty({
    example: EServiceOfferStatus.ACTIVE,
    description: "New service offer status",
    enum: EServiceOfferStatus,
  })
  @IsNotEmpty()
  @IsEnum(EServiceOfferStatus)
  @FieldType("select", true)
  @FieldOptions([
    { value: EServiceOfferStatus.ACTIVE, label: "Active" },
    { value: EServiceOfferStatus.INACTIVE, label: "Inactive" },
  ])
  status: EServiceOfferStatus;

  @ApiPropertyOptional({
    example: "Offer activated",
    description: "Optional message for the status change",
  })
  @IsOptional()
  @IsString()
  message?: string;
}

