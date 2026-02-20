import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto, SingleQueryDto } from "../common/list-query.dto";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { OmitType } from "../../lib/dto-type-adapter";
import { EPaymentProcessorType } from "../../enums/payment-processors.enum";
import type { IPaymentProcessor } from "../../interfaces/payment-processors.interface";

export class CreatePaymentProcessorDto {
  @ApiProperty({
    example: "stripe",
    description: "Payment processor type",
    enum: EPaymentProcessorType,
  })
  @IsEnum(EPaymentProcessorType)
  @IsNotEmpty()
  @FieldType("select", true)
  @FieldOptions(
    Object.values(EPaymentProcessorType).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  type: EPaymentProcessorType;

  @ApiProperty({
    example: true,
    description: "Is this payment processor enabled?",
  })
  @IsBoolean()
  @FieldType("checkbox", true)
  enabled: boolean;

  @ApiProperty({
    example: "Stripe payment configuration",
    description: "Description or notes",
  })
  @IsString()
  @IsOptional()
  @FieldType("textarea", false)
  description?: string;
}

export class UpdatePaymentProcessorDto extends PartialType(
  CreatePaymentProcessorDto
) {}

export class PaymentProcessorListDto extends ListQueryDto<IPaymentProcessor> {
  @ApiPropertyOptional({
    example: "stripe",
    description: "Filter by payment processor type",
    enum: EPaymentProcessorType,
  })
  @IsEnum(EPaymentProcessorType)
  @IsOptional()
  @FieldType("select", false)
  @FieldOptions(
    Object.values(EPaymentProcessorType).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  type?: EPaymentProcessorType;

  @ApiPropertyOptional({
    example: true,
    description: "Filter by enabled status",
  })
  @IsBoolean()
  @IsOptional()
  @FieldType("checkbox", false)
  enabled?: boolean;
}

export class PaymentProcessorDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Payment processor ID",
  })
  id: string;

  @ApiProperty({
    example: "stripe",
    description: "Payment processor type",
    enum: EPaymentProcessorType,
  })
  @IsEnum(EPaymentProcessorType)
  type: EPaymentProcessorType;

  @ApiProperty({
    example: true,
    description: "Is this payment processor enabled?",
  })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    example: "Stripe payment configuration",
    description: "Description or notes",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Creation date",
  })
  createdAt: string;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Last update date",
  })
  updatedAt: string;
}

export class PaymentProcessorPaginatedDto {
  @ApiProperty({
    type: [PaymentProcessorDto],
    description: "List of payment processors",
  })
  data: PaymentProcessorDto[];

  @ApiProperty({ type: PaginationMetaDto, description: "Pagination metadata" })
  meta: PaginationMetaDto;
}
