import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Order } from './order.entity';
import { Product } from '@/modules/v1/product/entities/product.entity';

@Entity('order_line_items')
export class OrderLineItem extends GeneralBaseEntity {
  @ApiPropertyOptional({ description: 'Product ID (reference)' })
  @Column({ type: 'uuid', nullable: true })
  productId?: string;

  @ApiPropertyOptional({ description: 'Product variant ID (reference)' })
  @Column({ type: 'uuid', nullable: true })
  productVariantId?: string;

  @ApiProperty({ example: 'T-Shirt - Size M', description: 'Line item description' })
  @Column({ type: 'varchar', length: 500 })
  description: string;

  @ApiProperty({ example: 1, description: 'Quantity' })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 29.99, description: 'Unit price at time of order' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ManyToOne(() => Order, (order) => order.lineItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product?: Product;
}
