import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Expose } from 'class-transformer';

/** Single cart line (product or variant + quantity + price snapshot) */
export class CartLineItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Product variant ID if applicable' })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @ApiProperty({ example: 'T-Shirt - Size M', description: 'Display label' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Product Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 1, description: 'Quantity' })
  @IsNumber()
  @Min(1)
  @Expose()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 29.99, description: 'Unit price (snapshot)' })
  @IsNumber()
  @Min(0)
  @Expose()
  @Type(() => Number)
  unitPrice: number;
}

/** Cart payload (stored in Dragonfly and sent from frontend) */
export class CartDto {
  @ApiPropertyOptional({ type: [CartLineItemDto], description: 'Cart items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => CartLineItemDto)
  items?: CartLineItemDto[];
}

export class AddToCartDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Product variant ID' })
  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @ApiProperty({ example: 1, description: 'Quantity to add' })
  @IsNumber()
  @Min(1)
  @Expose()
  @Type(() => Number)
  quantity: number;
}
