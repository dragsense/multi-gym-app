import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '../../lib/dto-type-adapter';
import { Type, Expose } from 'class-transformer';
import { FieldType } from '../../decorators/field.decorator';
import { ListQueryDto } from '../common/list-query.dto';
import { PaginationMetaDto } from '../common/pagination.dto';
import { AttributeDto } from './attribute.dto';

export class CreateAttributeValueDto {
  @ApiProperty({ example: 'Red', description: 'Attribute value(s). Use comma-separated values to create multiple (e.g. Red, Blue, Green or XL, L, M)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @FieldType('text', true)
  value: string;

  @ApiProperty({ example: 'A vibrant red color', description: 'Description of the attribute value' })
  @IsString()
  @IsOptional()
  @FieldType('textarea', false)
  description?: string;

  @ApiProperty({
    description: 'Attribute this value belongs to',
    type: () => AttributeDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Expose()
  @Type(() => AttributeDto)
  @FieldType('custom', true)
  attribute: AttributeDto;
}

export class UpdateAttributeValueDto {
  @ApiProperty({ example: 'Red', description: 'Attribute value (e.g. Red, Blue, XL)' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @FieldType('text', false)
  value: string;

  @ApiProperty({ example: 'A vibrant red color', description: 'Description of the attribute value' })
  @IsString()
  @IsOptional()
  @FieldType('textarea', false)
  description?: string;
}

export class AttributeValueListDto extends ListQueryDto<AttributeValueDto> {
}

export class AttributeValuePaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [AttributeValueDto] })
  @Expose()
  @Type(() => AttributeValueDto)
  data: AttributeValueDto[];
}

export class AttributeValueDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Red' })
  value: string;

  @ApiProperty({ example: 'A vibrant red color' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: () => AttributeDto })
  @Expose()
  @Type(() => AttributeDto)
  @IsOptional()
  attribute?: AttributeDto;

  @ApiPropertyOptional()
  @IsOptional()
  createdAt?: string;
  
  @ApiPropertyOptional()
  updatedAt?: string;
}
