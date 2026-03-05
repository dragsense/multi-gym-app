import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '../../lib/dto-type-adapter';
import { PaginationMetaDto } from '../common/pagination.dto';
import { ListQueryDto } from '../common/list-query.dto';
import { FieldType, FieldOptions } from '../../decorators/field.decorator';
import { EAIProcessorType } from '../../enums/ai-processors.enum';
import type { IAIProcessor } from '../../interfaces/ai-processors.interface';

export class CreateAIProcessorDto {
  @ApiProperty({
    example: 'openai',
    description: 'AI processor type',
    enum: EAIProcessorType,
  })
  @IsEnum(EAIProcessorType)
  @IsNotEmpty()
  @FieldType('select', true)
  @FieldOptions(
    Object.values(EAIProcessorType)
      .filter((v) => v !== EAIProcessorType.OTHER)
      .map((v) => ({
        value: v,
        label: v
          .split('_')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' '),
      })),
  )
  type: EAIProcessorType;

  @ApiProperty({
    example: true,
    description: 'Is this AI processor enabled?',
  })
  @IsBoolean()
  @FieldType('checkbox', true)
  enabled: boolean;

  @ApiPropertyOptional({
    example: 'OpenAI GPT models',
    description: 'Description or notes',
  })
  @IsString()
  @IsOptional()
  @FieldType('textarea', false)
  description?: string;
}

export class UpdateAIProcessorDto extends PartialType(CreateAIProcessorDto) {}

export class AIProcessorListDto extends ListQueryDto<IAIProcessor> {
  @ApiPropertyOptional({
    example: 'openai',
    description: 'Filter by AI processor type',
    enum: EAIProcessorType,
  })
  @IsEnum(EAIProcessorType)
  @IsOptional()
  @FieldType('select', false)
  @FieldOptions(
    Object.values(EAIProcessorType).map((v) => ({
      value: v,
      label: v
        .split('_')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' '),
    })),
  )
  type?: EAIProcessorType;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by enabled status',
  })
  @IsBoolean()
  @IsOptional()
  @FieldType('checkbox', false)
  enabled?: boolean;
}

export class AIProcessorDto {
  @ApiProperty({ description: 'AI processor ID' })
  id: string;

  @ApiProperty({
    example: 'openai',
    description: 'AI processor type',
    enum: EAIProcessorType,
  })
  type: EAIProcessorType;

  @ApiProperty({ example: true, description: 'Is enabled?' })
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: string;
}

export class AIProcessorPaginatedDto {
  @ApiProperty({ type: [AIProcessorDto] })
  data: AIProcessorDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
