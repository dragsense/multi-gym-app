import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Billing } from './billing.entity';

@Entity('billing_line_items')
export class BillingLineItem extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Training Session',
    description: 'Line item description',
  })
  @Column({ type: 'varchar', length: 500 })
  description: string;

  @ApiProperty({ example: 1, description: 'Line item quantity' })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 50.0, description: 'Line item unit price' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiPropertyOptional({
    example: 'Additional notes for this line item',
    description: 'Line item notes',
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Billing, (billing) => billing.lineItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'billingId' })
  billing: Billing;
}


