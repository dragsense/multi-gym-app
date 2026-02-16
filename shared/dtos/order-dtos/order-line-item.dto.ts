import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '../../lib/dto-type-adapter';
import { Type } from 'class-transformer';
import { FieldType } from '../../decorators/field.decorator';

/** Used when creating an order from cart (productId, variantId, quantity, unitPrice snapshot) */
export class CreateOrderLineItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Product variant ID (if variant was selected)' })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @ApiProperty({ example: 'T-Shirt - Size M', description: 'Line item description (product name + variant)' })
  @IsString()
  @IsNotEmpty()
  @FieldType('text', true)
  description: string;

  @ApiProperty({ example: 1, description: 'Quantity' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @FieldType('number', true)
  quantity: number;

  @ApiProperty({ example: 29.99, description: 'Unit price at time of order' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @FieldType('number', true)
  unitPrice: number;
}

export class UpdateOrderLineItemDto extends PartialType(CreateOrderLineItemDto) {}

export class OrderLineItemDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productVariantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'quantity * unitPrice' })
  @IsOptional()
  @IsNumber()
  total?: number;

  @ApiPropertyOptional()
  @IsOptional()
  createdAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  updatedAt?: Date;
}
