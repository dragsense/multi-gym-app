import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  MaxLength,
  Min,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType, PartialType } from '../../lib/dto-type-adapter';
import { Type } from 'class-transformer';
import { FieldType } from '../../decorators/field.decorator';
import { PaginationMetaDto } from '../common/pagination.dto';
import { ListQueryDto } from '../common/list-query.dto';
import { ProductDto } from './product.dto';
import { AttributeValueDto } from './attribute-value.dto';

export class CreateProductVariantDto {
  @ApiProperty({ example: 'SKU-001', description: 'Variant SKU' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @FieldType('text', true)
  sku: string;

  @ApiProperty({ example: 34.99, description: 'Variant price' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @FieldType('number', true)
  price: number;

  @ApiProperty({ example: 50, description: 'Variant quantity' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @FieldType('number', true)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Attribute value IDs (e.g. Color=Red, Size=M)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @FieldType('custom', false)
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  attributeValues?: AttributeValueDto[];

  @ApiPropertyOptional({ example: true, description: 'Whether variant is active', default: true })
  @IsOptional()
  @IsBoolean()
  @FieldType('switch', false)
  isActive?: boolean;
}

export class UpdateProductVariantDto extends PartialType(
  OmitType(CreateProductVariantDto, ['attributeValues']),
) {
  @ApiPropertyOptional({ description: 'Existing variant ID – if present, update; otherwise create' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({
    type: [AttributeValueDto],
    description: 'Attribute values to update/create/delete. Include id to update; omit to create; omit from list to delete.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  @FieldType('custom', false)
  attributeValues?: AttributeValueDto[];
}

export class ProductVariantListDto extends ListQueryDto<ProductVariantDto> {

}

export class ProductVariantPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [ProductVariantDto] })
  @Type(() => ProductVariantDto)
  data: ProductVariantDto[];
}

export class ProductVariantDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'SKU-001' })
  sku: string;

  @ApiProperty({ example: 34.99 })
  price: number;

  @ApiProperty({ example: 50 })
  quantity: number;

  @ApiPropertyOptional({ type: () => ProductDto })
  @Type(() => ProductDto)
  product?: ProductDto;

  @ApiPropertyOptional({ type: () => [AttributeValueDto] })
  @Type(() => AttributeValueDto)
  attributeValues?: AttributeValueDto[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  updatedAt?: string;
}
