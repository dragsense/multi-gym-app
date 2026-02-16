import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Order } from './order.entity';
import { EOrderStatus } from '@shared/enums/order.enum';
import { User } from '@/common/base-user/entities/user.entity';

@Entity('order_history')
export class OrderHistory extends GeneralBaseEntity {
  @ApiProperty({ type: () => Order, description: 'Associated order' })
  @ManyToOne(() => Order, (order) => order.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({
    example: 'PENDING',
    description: 'Order status at this point in time',
    enum: EOrderStatus,
  })
  @Column({ type: 'enum', enum: EOrderStatus })
  status: EOrderStatus;

  @ApiProperty({
    example: 'ORDER_CREATED',
    description:
      'Source of this history event (e.g. ORDER_CREATED, STATUS_UPDATE, PAYMENT_COMPLETED)',
  })
  @Column({ type: 'varchar', length: 100 })
  source: string;

  @ApiPropertyOptional({
    example: 'Order placed successfully',
    description: 'Optional short description of the event',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  message?: string;

  @ApiPropertyOptional({
    example: '{"previousStatus":"PENDING","newStatus":"PAID"}',
    description: 'Optional extra metadata (JSON)',
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: '2024-01-15T09:00:00.000Z',
    description: 'Date and time when this status change occurred',
  })
  @Column({ type: 'timestamptz', nullable: true })
  occurredAt?: Date;

  @ApiPropertyOptional({ type: () => User, description: 'User who triggered this change' })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changedByUserId' })
  changedBy?: User;
}
