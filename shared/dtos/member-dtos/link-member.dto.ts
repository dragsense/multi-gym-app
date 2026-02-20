import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { PartialType, OmitType } from '../../lib/dto-type-adapter';
import { PaginationMetaDto } from '../common/pagination.dto';
import { ListQueryDto, SingleQueryDto } from '../common/list-query.dto';
import type { ILinkMember } from '../../interfaces/link-member.interface';
import { FieldType } from '../../decorators/field.decorator';
import {
  Equals,
} from '../../decorators/crud.dto.decorators';
import { MemberDto } from './member.dto';

export class CreateLinkMemberDto {
  @ApiProperty({
    type: () => MemberDto,
    description: 'Primary member',
  })
  @ValidateNested()
  @Expose()
  @Type(() => MemberDto)
  @FieldType('nested', true, MemberDto)
  primaryMember: MemberDto;

  @ApiProperty({
    type: () => MemberDto,
    description: 'Linked member',
  })
  @ValidateNested()
  @Expose()
  @Type(() => MemberDto)
  @FieldType('nested', true, MemberDto)
  linkedMember: MemberDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to view session check for this link',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @FieldType('switch', false)
  viewSessionCheck?: boolean;

  @ApiPropertyOptional({
    example: 'Family member link',
    description: 'Notes or description about the link',
  })
  @IsOptional()
  @IsString()
  @FieldType('textarea', false)
  notes?: string;
}

export class UpdateLinkMemberDto extends PartialType(
  OmitType(CreateLinkMemberDto, ['primaryMember', 'linkedMember'])
) {}

export class LinkMemberListDto extends ListQueryDto<ILinkMember> {
  @ApiPropertyOptional({
    description: 'Filter by primary member ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  @Equals()
  @FieldType('text', false)
  primaryMemberId: string;

  @ApiPropertyOptional({
    description: 'Filter by linked member ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  @Equals()
  @FieldType('text', false)
  linkedMemberId?: string;

  @ApiPropertyOptional({
    description: 'Filter by view session check',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Equals()
  @FieldType('switch', false)
  viewSessionCheck?: boolean;
}

export class LinkMemberPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [LinkMemberDto] })
  @Expose()
  @Type(() => LinkMemberDto)
  data: LinkMemberDto[];
}

export class LinkMemberDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Link Member ID',
  })
  @IsUUID()
  @FieldType('text', true)
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Primary member ID',
  })
  @IsUUID()
  @FieldType('text', true)
  primaryMemberId: string;

  @ApiProperty({
    type: () => MemberDto,
    description: 'Primary member',
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => MemberDto)
  @FieldType('nested', false, MemberDto)
  primaryMember?: MemberDto;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Linked member ID',
  })
  @IsUUID()
  @FieldType('text', true)
  linkedMemberId: string;

  @ApiProperty({
    type: () => MemberDto,
    description: 'Linked member',
  })
  @IsOptional()
  @ValidateNested()
  @Expose()
  @Type(() => MemberDto)
  @FieldType('nested', false, MemberDto)
  linkedMember?: MemberDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to view session check for this link',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @FieldType('switch', false)
  viewSessionCheck?: boolean;

  @ApiPropertyOptional({
    example: 'Family member link',
    description: 'Notes or description about the link',
  })
  @IsOptional()
  @IsString()
  @FieldType('textarea', false)
  notes?: string;

  @IsOptional()
  createdAt?: Date;

  @IsOptional()
  updatedAt?: Date;
}
