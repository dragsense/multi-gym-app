import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  MaxLength,
  Min,
  ValidateNested,
  ArrayMaxSize,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType, PartialType } from '../../lib/dto-type-adapter';
import { Transform, Type, Expose } from 'class-transformer';
import { FieldType } from '../../decorators/field.decorator';
import { PaginationMetaDto } from '../common/pagination.dto';
import { ListQueryDto } from '../common/list-query.dto';
import { Equals } from '../../decorators/crud.dto.decorators';
import {
  CreateProductVariantDto,
  ProductVariantDto,
  UpdateProductVariantDto,
} from './product-variant.dto';
import { FileUploadDto } from '../file-upload-dtos/file-upload.dto';
import { ProductTypeDto } from './product-type.dto';

// Custom validator to ensure sum of variant quantities <= totalQuantity
@ValidatorConstraint({ name: 'variantQuantitiesSumValid', async: false })
export class VariantQuantitiesSumValidConstraint implements ValidatorConstraintInterface {
  validate(variants: any, args: ValidationArguments) {
    const obj = args.object as CreateProductDto | UpdateProductDto;
    const totalQuantity = obj.totalQuantity;
    
    // If no variants or no totalQuantity, skip validation (handled by other validators)
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return true;
    }
    
    if (totalQuantity === undefined || totalQuantity === null) {
      return true; // Let @IsNumber and @Min handle this
    }
    
    // Calculate sum of all variant quantities
    const totalVariantQuantity = variants.reduce((sum, variant) => {
      const qty = variant?.quantity ?? 0;
      return sum + (typeof qty === 'number' ? qty : 0);
    }, 0);
    
    // Check if sum is less than or equal to totalQuantity
    return totalVariantQuantity <= totalQuantity;
  }

  defaultMessage(args: ValidationArguments) {
    const obj = args.object as CreateProductDto | UpdateProductDto;
    const variants = obj.variants || [];
    const totalQuantity = obj.totalQuantity ?? 0;
    
    const totalVariantQuantity = variants.reduce((sum, variant) => {
      const qty = variant?.quantity ?? 0;
      return sum + (typeof qty === 'number' ? qty : 0);
    }, 0);
    
    return `Sum of variant quantities (${totalVariantQuantity}) must be less than or equal to total quantity (${totalQuantity})`;
  }
}

export class CreateProductDto {
  @ApiProperty({ example: 'T-Shirt', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @FieldType('text', true)
  name: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Product type ID (e.g. Clothing, Electronics)',
  })
  @Expose()
  @Transform(({ value }) => {
    // Handle multipart/form-data: productType may come as JSON string
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => ProductTypeDto)
  @FieldType('custom', false)
  productType?: ProductTypeDto;

  @ApiPropertyOptional({ example: 'Comfortable cotton t-shirt', description: 'Product description' })
  @IsOptional()
  @IsString()
  @FieldType('quill', false)
  description?: string;

  @ApiPropertyOptional({ example: 'SKU', description: 'Default SKU prefix for variants (e.g. MYPROD → MYPROD-1, MYPROD-2)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @FieldType('text', false)
  defaultSku?: string;

  @ApiProperty({ example: 29.99, description: 'Default price' })
  @IsNumber()
  @Min(0)
  @Expose()
  @Type(() => Number)
  @FieldType('number', true)
  defaultPrice: number;

  @ApiProperty({ example: 100, description: 'Total quantity across all variants' })
  @IsNumber()
  @Min(1)
  @Expose()
  @Type(() => Number)
  @FieldType('number', true)
  totalQuantity: number;

  /** Same as profile documents: multipart binary files (max 10). Sent via form-data, omitted from JSON body. */
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    required: false,
    description: 'Default image files (max 10)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @FieldType('custom')
  defaultImages?: any[];

  @ApiPropertyOptional({ example: true, description: 'Whether product is active', default: true })
  @IsOptional()
  @IsBoolean()
  @FieldType('switch', false)
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [CreateProductVariantDto],
    description: 'Variants to create with the product.',
  })
  @Expose()
  @Transform(({ value }) => {
    // Handle multipart/form-data: variants may come as JSON string
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : value;
      } catch {
        return value;
      }
    }
    // If already an array, return as is
    if (Array.isArray(value)) {
      return value;
    }
    return value;
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => CreateProductVariantDto)
  @Validate(VariantQuantitiesSumValidConstraint)
  @FieldType('custom', false)
  variants?: CreateProductVariantDto[];
}

export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, ['variants'])) {
  @ApiPropertyOptional({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    description: 'Array of default image IDs to remove (same as profile removedDocumentIds)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedDefaultImageIds?: string[];

  @ApiPropertyOptional({
    type: [UpdateProductVariantDto],
    description: 'Variants to create/update/delete.',
  })
  @Expose()
  @Transform(({ value }) => {
    // Handle multipart/form-data: variants may come as JSON string
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : value;
      } catch {
        return value;
      }
    }
    // If already an array, return as is
    if (Array.isArray(value)) {
      return value;
    }
    return value;
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => UpdateProductVariantDto)
  @Validate(VariantQuantitiesSumValidConstraint)
  @FieldType('custom', false)
  variants?: UpdateProductVariantDto[];
}

export class ProductListDto extends ListQueryDto<ProductDto> {
  @IsOptional()
  @IsBoolean()
  @Equals()
  @FieldType('switch', false)
  isActive?: boolean;
}

export class ProductPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [ProductDto] })
  @Expose()
  @Type(() => ProductDto)
  data: ProductDto[];
}

/** Response DTO – do not expose entity directly */
export class ProductDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ type: () => ProductTypeDto, description: 'Product type' })
  @Expose()
  @Type(() => ProductTypeDto)
  productType?: ProductTypeDto;

  @ApiProperty({ example: 'T-Shirt' })
  name: string;

  @ApiPropertyOptional({ example: 'Comfortable cotton t-shirt' })
  description?: string;

  @ApiPropertyOptional({ example: 'SKU' })
  defaultSku?: string;

  @ApiProperty({ example: 29.99 })
  defaultPrice: number;

  @ApiProperty({ example: 100 })
  totalQuantity: number;

  @ApiPropertyOptional({ type: () => [FileUploadDto], description: 'Default images (FileUpload)' })
  @Expose()
  @Type(() => FileUploadDto)
  defaultImages?: FileUploadDto[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ type: () => [ProductVariantDto] })
  @Expose()
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @ApiPropertyOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  updatedAt?: string;
}
