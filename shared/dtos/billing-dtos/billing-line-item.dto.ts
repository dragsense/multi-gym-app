import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { FieldType } from "../../decorators/field.decorator";

export class CreateBillingLineItemDto {
  @ApiProperty({
    example: "Training Session",
    description: "Line item description",
  })
  @IsString()
  @IsNotEmpty()
  @FieldType("text", true)
  description: string;

  @ApiProperty({ example: 1, description: "Line item quantity" })
  @IsNumber()
  @Min(1)
  @FieldType("number", true)
  @Expose()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 50.0, description: "Line item unit price" })
  @IsNumber()
  @Min(0)
  @FieldType("number", true)
  @Expose()
  @Type(() => Number)
  unitPrice: number;
}

export class UpdateBillingLineItemDto extends PartialType(
  CreateBillingLineItemDto
) {}

export class BillingLineItemDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Line item ID",
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    example: "Training Session",
    description: "Line item description",
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({ example: 1, description: "Line item quantity" })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({ example: 50.0, description: "Line item unit price" })
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiProperty({
    example: 50.0,
    description: "Line item total (quantity * unitPrice)",
  })
  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}

