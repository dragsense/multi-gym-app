import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../common/list-query.dto';
import { PaginationMetaDto } from '../common/pagination.dto';
import { FieldType } from '../../decorators/field.decorator';
import { EOrderStatus } from '../../enums/order.enum';
import { UserDto } from '../user-dtos/user.dto';
import { OrderDto } from './order.dto';

export class CreateOrderHistoryDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Order ID',
  })
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @ApiProperty({
    example: 'PENDING',
    description: 'Order status',
    enum: EOrderStatus,
  })
  @IsEnum(EOrderStatus)
  @FieldType('select', true)
  status: EOrderStatus;

  @ApiProperty({
    example: 'ORDER_CREATED',
    description: 'Source of this history event',
  })
  @IsString()
  @IsNotEmpty()
  @FieldType('text', true)
  source: string;

  @ApiPropertyOptional({
    example: 'Order placed successfully',
    description: 'Optional description of the event',
  })
  @IsOptional()
  @IsString()
  @FieldType('text', false)
  message?: string;

  @ApiPropertyOptional({
    example: '{"previousStatus":"PENDING","newStatus":"PAID"}',
    description: 'Optional metadata',
  })
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: '2024-01-15T09:00:00.000Z',
    description: 'When this change occurred',
  })
  @IsOptional()
  occurredAt?: Date;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User who triggered this change',
  })
  @IsOptional()
  @IsUUID()
  changedByUserId?: string;
}

export class OrderHistoryListDto extends ListQueryDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by order ID',
  })
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({
    enum: EOrderStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(EOrderStatus)
  status?: EOrderStatus;
}

export class OrderHistoryDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ type: () => OrderDto })
  @ValidateNested()
  @Type(() => OrderDto)
  order: OrderDto;

  @ApiProperty({ enum: EOrderStatus })
  @IsEnum(EOrderStatus)
  status: EOrderStatus;

  @ApiProperty()
  @IsString()
  source: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  occurredAt?: Date;

  @ApiPropertyOptional({ type: () => UserDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  changedBy?: UserDto;

  @ApiPropertyOptional()
  @IsOptional()
  createdAt?: Date;
}

export class OrderHistoryPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: [OrderHistoryDto] })
  data: OrderHistoryDto[];
}
