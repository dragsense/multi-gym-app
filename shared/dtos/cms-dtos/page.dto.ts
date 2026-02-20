import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsObject,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType, PartialType } from '../../lib/dto-type-adapter';
import { PaginationMetaDto } from '../common/pagination.dto';
import { ListQueryDto } from '../common/list-query.dto';
import { FieldType } from '../../decorators/field.decorator';
import { Type, Transform, Expose } from 'class-transformer';

export class CreatePageDto {
  @ApiProperty({ example: 'Terms and Conditions', description: 'Page title' })
  @IsString()
  @IsNotEmpty()
  @FieldType('text', true)
  title: string;

  @ApiProperty({
    example: 'terms-and-conditions',
    description: 'Page slug (unique)',
  })
  @IsString()
  @IsNotEmpty()
  @FieldType('text', true)
  slug: string;

  @ApiProperty({
    description: 'PUCK editor content (JSON)',
  })
  @Expose()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsObject()
  @IsOptional()
  @FieldType('custom', false)
  content: any;

  @ApiPropertyOptional({
    example: 'Terms and conditions page',
    description: 'Page description',
  })
  @IsString()
  @IsOptional()
  @FieldType('textarea', false)
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the page is published',
  })
  @IsBoolean()
  @IsOptional()
  @FieldType('checkbox', false)
  isPublished?: boolean;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Publication date',
  })
  @IsDateString()
  @IsOptional()
  publishedAt?: string;
}

export class UpdatePageDto extends PartialType(CreatePageDto) {}

export class PageDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  content: any;

  @ApiProperty()
  description?: string; 

  @ApiProperty()
  isPublished?: boolean;

  @ApiProperty()
  publishedAt?: string;

  @ApiProperty()
  isSystem?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

}

export class PageListDto extends ListQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class PagePaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [PageDto] })
  @Expose()
  @Type(() => PageDto)
  data: PageDto[];
}
