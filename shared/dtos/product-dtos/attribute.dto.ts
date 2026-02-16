import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '../../lib/dto-type-adapter';
import { Type } from 'class-transformer';
import { FieldType, FieldOptions } from '../../decorators/field.decorator';
import { PaginationMetaDto } from '../common/pagination.dto';
import { ListQueryDto } from '../common/list-query.dto';
import { EAttributeType } from '../../enums/products/attribute-type.enum';

export class CreateAttributeDto {
  @ApiProperty({ example: 'Color', description: 'Attribute name (e.g. Color, Size)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @FieldType('text', true)
  name: string;

  @ApiProperty({ 
    example: EAttributeType.COLOR, 
    description: 'Attribute type',
    enum: EAttributeType,
  })
  @IsEnum(EAttributeType)
  @IsOptional()
  @FieldType('select', false)
  @FieldOptions(
    Object.values(EAttributeType).map((value) => ({
      value,
      label: value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    }))
  )
  type?: EAttributeType;
}

export class UpdateAttributeDto extends PartialType(CreateAttributeDto) {}

export class AttributeListDto extends ListQueryDto<AttributeDto> {
}

export class AttributePaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [AttributeDto] })
  @Type(() => AttributeDto)
  data: AttributeDto[];
}

export class AttributeDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'Color' })
  @IsOptional()
  name?: string;

  @ApiProperty({ example: EAttributeType.COLOR, enum: EAttributeType })
  @IsOptional()
  @IsEnum(EAttributeType)
  type?: EAttributeType;

  @ApiPropertyOptional()
  @IsOptional()
  createdAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  updatedAt?: string;
}
