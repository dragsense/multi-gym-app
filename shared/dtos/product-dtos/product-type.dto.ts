import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '../../lib/dto-type-adapter';
import { Type, Expose } from 'class-transformer';
import { FieldType } from '../../decorators/field.decorator';
import { PaginationMetaDto } from '../common/pagination.dto';
import { ListQueryDto } from '../common/list-query.dto';

export class CreateProductTypeDto {
  @ApiProperty({ example: 'Clothing', description: 'Product type name (e.g. Clothing, Electronics)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @FieldType('text', true)
  name: string;
}

export class UpdateProductTypeDto extends PartialType(CreateProductTypeDto) {}

export class ProductTypeListDto extends ListQueryDto<ProductTypeDto> {}

export class ProductTypePaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [ProductTypeDto] })
  @Expose()
  @Type(() => ProductTypeDto)
  data: ProductTypeDto[];
}

export class ProductTypeDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Clothing' })
  @IsOptional()
  name: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  productsCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  updatedAt?: string;
}
