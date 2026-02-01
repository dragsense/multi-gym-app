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
import { EPaymentMethodType } from "../../enums/payment-methods.enum";
import { IPaymentMethod } from "../../interfaces/payment-methods.interface";

// Create Payment Method DTO
export class CreatePaymentMethodDto {
  @ApiProperty({
    example: "stripe",
    description: "Payment method type",
    enum: EPaymentMethodType,
  })
  @IsEnum(EPaymentMethodType)
  @IsNotEmpty()
  @FieldType("select", true)
  @FieldOptions(
    Object.values(EPaymentMethodType).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  type: EPaymentMethodType;

  @ApiProperty({
    example: true,
    description: "Is this payment method enabled?",
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

export class UpdatePaymentMethodDto extends PartialType(
  CreatePaymentMethodDto
) {}

export class PaymentMethodListDto extends ListQueryDto<IPaymentMethod> {
  @ApiPropertyOptional({
    example: "stripe",
    description: "Filter by payment method type",
    enum: EPaymentMethodType,
  })
  @IsEnum(EPaymentMethodType)
  @IsOptional()
  @FieldType("select", false)
  @FieldOptions(
    Object.values(EPaymentMethodType).map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }))
  )
  type?: EPaymentMethodType;

  @ApiPropertyOptional({
    example: true,
    description: "Filter by enabled status",
  })
  @IsBoolean()
  @IsOptional()
  @FieldType("checkbox", false)
  enabled?: boolean;
}

export class PaymentMethodDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Payment method ID",
  })
  id: string;

  @ApiProperty({
    example: "stripe",
    description: "Payment method type",
    enum: EPaymentMethodType,
  })
  @IsEnum(EPaymentMethodType)
  type: EPaymentMethodType;

  @ApiProperty({
    example: true,
    description: "Is this payment method enabled?",
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

export class PaymentMethodPaginatedDto {
  @ApiProperty({
    type: [PaymentMethodDto],
    description: "List of payment methods",
  })
  data: PaymentMethodDto[];

  @ApiProperty({ type: PaginationMetaDto, description: "Pagination metadata" })
  meta: PaginationMetaDto;
}
