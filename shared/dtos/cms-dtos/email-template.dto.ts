import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OmitType, PartialType } from '../../lib/dto-type-adapter';
import { PaginationMetaDto } from '../common/pagination.dto';
import { ListQueryDto } from '../common/list-query.dto';
import { FieldType } from '../../decorators/field.decorator';
import { Type, Transform, Expose } from 'class-transformer';

export class CreateEmailTemplateDto {
  @ApiProperty({ example: 'Welcome Email', description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  @FieldType('text', true)
  name: string;

  @ApiProperty({
    example: 'welcome-email',
    description: 'Template identifier (unique)',
  })
  @IsString()
  @IsNotEmpty()
  @FieldType('text', true)
  identifier: string;

  @ApiProperty({
    example: 'Welcome to our platform!',
    description: 'Email subject',
  })
  @IsString()
  @IsNotEmpty()
  @FieldType('text', true)
  subject: string;

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
    example: ['user.email', 'user.firstName', 'user.lastName'],
    description: 'Available dynamic variables',
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  availableVariables?: string[];

  @ApiPropertyOptional({
    example: 'Welcome email sent to new users',
    description: 'Template description',
  })
  @IsString()
  @IsOptional()
  @FieldType('textarea', false)
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the template is active',
  })
  @IsBoolean()
  @IsOptional()
  @FieldType('checkbox', false)
  isActive?: boolean;
}

export class UpdateEmailTemplateDto extends PartialType(CreateEmailTemplateDto) {}

export class EmailTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  identifier: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  content: any;

  @ApiProperty()
  availableVariables?: string[];

  @ApiProperty()
  description?: string;

  @ApiProperty()
  isActive?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class EmailTemplateListDto extends ListQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class EmailTemplatePaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [EmailTemplateDto] })
  @Expose()
  @Type(() => EmailTemplateDto)
  data: EmailTemplateDto[];
}
