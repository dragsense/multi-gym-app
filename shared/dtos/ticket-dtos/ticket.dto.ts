import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "../../lib/dto-type-adapter";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto, SingleQueryDto } from "../common/list-query.dto";
import {
  Equals,
  In,
  DateRange,
  RelationFilter,
} from "../../decorators/crud.dto.decorators";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { UserDto } from "../user-dtos";
import { ETicketStatus, ETicketPriority, ETicketCategory } from "../../enums/ticket.enum";

export class TicketDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Ticket ID',
  })
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @ApiProperty({
    example: 'Unable to access dashboard',
    description: 'Ticket title',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'I am unable to access the dashboard after logging in',
    description: 'Ticket description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ETicketStatus,
    example: ETicketStatus.OPEN,
    description: 'Current status of the ticket',
  })
  @IsEnum(ETicketStatus)
  status: ETicketStatus;

  @ApiProperty({
    enum: ETicketPriority,
    example: ETicketPriority.MEDIUM,
    description: 'Priority level of the ticket',
  })
  @IsEnum(ETicketPriority)
  priority: ETicketPriority;

  @ApiProperty({
    enum: ETicketCategory,
    example: ETicketCategory.TECHNICAL,
    description: 'Category of the ticket',
  })
  @IsEnum(ETicketCategory)
  category: ETicketCategory;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User who created this ticket',
  })
  @IsNotEmpty()
  @IsUUID()
  createdByUserId: string;

  @ApiPropertyOptional({
    type: () => UserDto,
    description: 'User who created this ticket',
  })
  @Type(() => UserDto)
  @IsOptional()
  createdBy?: UserDto;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User assigned to handle this ticket',
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @ApiPropertyOptional({
    type: () => UserDto,
    description: 'User assigned to handle this ticket',
  })
  @Type(() => UserDto)
  @IsOptional()
  assignedTo?: UserDto;

  @ApiPropertyOptional({
    example: '2024-01-20T15:30:00.000Z',
    description: 'Date when ticket was resolved',
  })
  @IsOptional()
  resolvedAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-20T15:30:00.000Z',
    description: 'Date when ticket was closed',
  })
  @IsOptional()
  closedAt?: Date;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Timestamp when the ticket was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Timestamp when the ticket was last updated',
  })
  updatedAt: Date;
}

export class CreateTicketDto {
  @ApiProperty({
    example: 'Unable to access dashboard',
    description: 'Ticket title',
  })
  @IsNotEmpty()
  @IsString()
  @FieldType("text", false)
  title: string;

  @ApiPropertyOptional({
    example: 'I am unable to access the dashboard after logging in',
    description: 'Ticket description',
  })
  @IsOptional()
  @IsString()
  @FieldType("quill", false)
  description?: string;

  @ApiPropertyOptional({
    enum: ETicketStatus,
    example: ETicketStatus.OPEN,
    description: 'Current status of the ticket',
    default: ETicketStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(ETicketStatus)
  @FieldType("select", false)
  @FieldOptions([
    { value: ETicketStatus.OPEN, label: "Open" },
    { value: ETicketStatus.IN_PROGRESS, label: "In Progress" },
    { value: ETicketStatus.PENDING, label: "Pending" },
    { value: ETicketStatus.RESOLVED, label: "Resolved" },
    { value: ETicketStatus.CLOSED, label: "Closed" },
  ])
  status?: ETicketStatus;

  @ApiPropertyOptional({
    enum: ETicketPriority,
    example: ETicketPriority.MEDIUM,
    description: 'Priority level of the ticket',
    default: ETicketPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(ETicketPriority)
  @FieldType("select", false)
  @FieldOptions([
    { value: ETicketPriority.LOW, label: "Low" },
    { value: ETicketPriority.MEDIUM, label: "Medium" },
    { value: ETicketPriority.HIGH, label: "High" },
    { value: ETicketPriority.URGENT, label: "Urgent" },
  ])
  priority?: ETicketPriority;

  @ApiPropertyOptional({
    enum: ETicketCategory,
    example: ETicketCategory.TECHNICAL,
    description: 'Category of the ticket',
    default: ETicketCategory.GENERAL,
  })
  @IsOptional()
  @IsEnum(ETicketCategory)
  @FieldType("select", false)
  @FieldOptions([
    { value: ETicketCategory.TECHNICAL, label: "Technical" },
    { value: ETicketCategory.BILLING, label: "Billing" },
    { value: ETicketCategory.FEATURE_REQUEST, label: "Feature Request" },
    { value: ETicketCategory.BUG_REPORT, label: "Bug Report" },
    { value: ETicketCategory.GENERAL, label: "General" },
    { value: ETicketCategory.ACCOUNT, label: "Account" },
  ])
  category?: ETicketCategory;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User assigned to handle this ticket',
  })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;
}

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiPropertyOptional({
    example: '2024-01-20T15:30:00.000Z',
    description: 'Date when ticket was resolved',
  })
  @IsOptional()
  @IsDateString()
  resolvedAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-20T15:30:00.000Z',
    description: 'Date when ticket was closed',
  })
  @IsOptional()
  @IsDateString()
  closedAt?: Date;
}

export class TicketListDto extends ListQueryDto<TicketDto> {
  @ApiPropertyOptional({
    enum: ETicketStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(ETicketStatus)
  @Equals()
  status?: ETicketStatus;

  @ApiPropertyOptional({
    enum: ETicketPriority,
    description: 'Filter by priority',
  })
  @IsOptional()
  @IsEnum(ETicketPriority)
  @Equals()
  priority?: ETicketPriority;

  @ApiPropertyOptional({
    enum: ETicketCategory,
    description: 'Filter by category',
  })
  @IsOptional()
  @IsEnum(ETicketCategory)
  @Equals()
  category?: ETicketCategory;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by created by user ID',
  })
  @IsOptional()
  @IsUUID()
  @Equals()
  createdByUserId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by assigned to user ID',
  })
  @IsOptional()
  @IsUUID()
  @Equals()
  assignedToUserId?: string;

  @ApiPropertyOptional({
    description: 'Filter by date range',
  })
  @IsOptional()
  @DateRange("createdAt")
  createdAtRange?: string;
}

export class TicketPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [TicketDto] })
  @Type(() => TicketDto)
  data: TicketDto[];
}
