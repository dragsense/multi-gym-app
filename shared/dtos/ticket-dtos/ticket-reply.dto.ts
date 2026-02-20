import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type, Expose } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import {
  Equals,
  RelationFilter,
} from "../../decorators/crud.dto.decorators";
import { FieldType } from "../../decorators/field.decorator";
import { UserDto } from "../user-dtos";

export class TicketReplyDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Reply ID',
  })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Ticket ID that this reply belongs to',
  })
  @IsNotEmpty()
  @IsUUID()
  ticketId: string;

  @ApiProperty({
    example: 'I have checked the issue and it seems to be a permission problem',
    description: 'Reply message/content',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User who created this reply',
  })
  @IsNotEmpty()
  @IsUUID()
  createdByUserId: string;

  @ApiPropertyOptional({
    type: () => UserDto,
    description: 'User who created this reply',
  })
  @Expose()
  @Type(() => UserDto)
  @IsOptional()
  createdBy?: UserDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this reply is internal (only visible to staff)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Timestamp when the reply was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Timestamp when the reply was last updated',
  })
  updatedAt: Date;
}

export class CreateTicketReplyDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Ticket ID that this reply belongs to',
  })
  @IsNotEmpty()
  @IsUUID()
  ticketId: string;

  @ApiProperty({
    example: 'I have checked the issue and it seems to be a permission problem',
    description: 'Reply message/content',
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("quill", true)
  message: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this reply is internal (only visible to staff)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

export class UpdateTicketReplyDto extends PartialType(CreateTicketReplyDto) {}

export class TicketReplyListDto extends ListQueryDto<TicketReplyDto> {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by ticket ID',
  })
  @IsOptional()
  @IsUUID()
  @Equals()
  ticketId?: string;
}

export class TicketReplyPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [TicketReplyDto] })
  @Expose()
  @Type(() => TicketReplyDto)
  data: TicketReplyDto[];
}
