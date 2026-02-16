import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { EOrderStatus } from '@shared/enums/order.enum';
import { User } from '@/common/base-user/entities/user.entity';
import { OrderLineItem } from './order-line-item.entity';
import { Billing } from '@/modules/v1/billings/entities/billing.entity';
import { OrderHistory } from './order-history.entity';

@Entity('orders')
export class Order extends GeneralBaseEntity {
  @ApiProperty({
    example: 'ORD-20240204-A1B2C',
    description: 'Unique order reference number',
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  orderRef: string;

  @ApiProperty({
    example: 'Product order - T-Shirt, Water Bottle',
    description: 'Order title',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({
    example: 'Store purchase',
    description: 'Order description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    example: 'PENDING',
    description: 'Order status',
    enum: EOrderStatus,
  })
  @Column({ type: 'enum', enum: EOrderStatus, default: EOrderStatus.PENDING })
  status: EOrderStatus;

  @ApiProperty({ example: 59.98, description: 'Total order amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @ApiProperty({ type: () => User, description: 'User who placed the order (buyer)' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'buyerUserId' })
  buyerUser: User;

  @ApiPropertyOptional({
    example: 'pm_xxx',
    description: 'Stripe payment method ID',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentMethodId?: string;

  @ApiPropertyOptional({ example: 'pi_xxx', description: 'Stripe payment intent ID' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentIntentId?: string;

  @ApiPropertyOptional({ description: 'Shipping Address Line 1' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  shippingAddressLine1?: string;

  @ApiPropertyOptional({ description: 'Shipping Address Line 2' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  shippingAddressLine2?: string;

  @ApiPropertyOptional({ description: 'Shipping City' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingCity?: string;

  @ApiPropertyOptional({ description: 'Shipping State/Province' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingState?: string;

  @ApiPropertyOptional({ description: 'Shipping Postal Code' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  shippingZip?: string;

  @ApiPropertyOptional({ description: 'Shipping Country' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingCountry?: string;

  @ApiPropertyOptional({
    description: 'Linked billing (invoice) for this order - created at checkout like session/membership billing',
  })
  @ManyToOne(() => Billing, { nullable: true })
  @JoinColumn({ name: 'billingId' })
  billing?: Billing;

  @OneToMany(() => OrderLineItem, (lineItem) => lineItem.order, {
    cascade: true,
  })
  lineItems: OrderLineItem[];

  @OneToMany(() => OrderHistory, (history) => history.order, {
    cascade: true,
  })
  history: OrderHistory[];
}
