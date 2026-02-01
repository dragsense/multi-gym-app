import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNotEmpty
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '../../lib/dto-type-adapter';
import { PaginationMetaDto } from '../common/pagination.dto';
import { ListQueryDto } from '../common/list-query.dto';
import { IMemberNote } from '../../interfaces/member-note.interface';
import { FieldType } from '../../decorators/field.decorator';
import {
  Equals,
  TransformToArray,
} from '../../decorators/crud.dto.decorators';

export class CreateMemberNoteDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Member ID',
  })
  @IsUUID()
  @FieldType('text', true)
  memberId: string;

  @ApiPropertyOptional({
    example: 'General information about the member',
    description: 'General information about the member',
  })
  @IsNotEmpty()
  @IsString()
  @FieldType('textarea', true)
  generalInfo: string;

  @ApiPropertyOptional({
    example: 'Medical conditions and history',
    description: 'Medical conditions and history',
  })
  @IsOptional()
  @IsString()
  @FieldType('textarea')
  medicalConditions?: string;

  @ApiPropertyOptional({
    example: ['Peanuts', 'Dairy', 'Shellfish'],
    description: 'List of allergies',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @TransformToArray()
  @FieldType('tags')
  allergies?: string[];

  @ApiPropertyOptional({
    example: 'Dr. John Smith',
    description: 'Physician name',
  })
  @IsOptional()
  @IsString()
  @FieldType('text')
  physicianName?: string;

  @ApiPropertyOptional({
    example: ['Aspirin', 'Metformin'],
    description: 'List of medications',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @TransformToArray()
  @FieldType('tags')
  medications?: string[];
}

export class UpdateMemberNoteDto extends PartialType(CreateMemberNoteDto) {}

export class MemberNoteListDto extends ListQueryDto<IMemberNote> {
  @ApiPropertyOptional({
    description: 'Filter by member ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  @Equals()
  @FieldType('text', false)
  memberId: string;
}

export class MemberNotePaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [MemberNoteDto] })
  @Type(() => MemberNoteDto)
  data: MemberNoteDto[];
}

export class MemberNoteDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Member Note ID',
  })
  @IsUUID()
  @FieldType('text', true)
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Member ID',
  })
  @IsUUID()
  @FieldType('text', true)
  memberId: string;

  @ApiPropertyOptional({
    example: 'General information about the member',
    description: 'General information about the member',
  })
  @IsOptional()
  @IsString()
  @FieldType('textarea')
  generalInfo?: string;

  @ApiPropertyOptional({
    example: 'Medical conditions and history',
    description: 'Medical conditions and history',
  })
  @IsOptional()
  @IsString()
  @FieldType('textarea')
  medicalConditions?: string;

  @ApiPropertyOptional({
    example: ['Peanuts', 'Dairy', 'Shellfish'],
    description: 'List of allergies',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @FieldType('tags')
  allergies?: string[];

  @ApiPropertyOptional({
    example: 'Dr. John Smith',
    description: 'Physician name',
  })
  @IsOptional()
  @IsString()
  @FieldType('text')
  physicianName?: string;

  @ApiPropertyOptional({
    example: ['Aspirin', 'Metformin'],
    description: 'List of medications',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @FieldType('tags')
  medications?: string[];

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}
