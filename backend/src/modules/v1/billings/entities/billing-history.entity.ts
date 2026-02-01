import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Billing } from './billing.entity';
import { EBillingStatus } from '@shared/enums/billing.enum';

@Entity('billing_history')
export class BillingHistory extends GeneralBaseEntity {
  @ApiProperty({ type: () => Billing, description: 'Associated billing' })
  @ManyToOne(() => Billing, (billing) => billing.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'billingId' })
  billing: Billing;

  @ApiProperty({
    example: 'PENDING',
    description: 'Billing status at this point in time',
    enum: EBillingStatus,
  })
  @Column({ type: 'enum', enum: EBillingStatus })
  status: EBillingStatus;

  @ApiProperty({
    example: 'SESSION_CHECKOUT',
    description:
      'Source of this history event (e.g. SESSION_CHECKOUT, BILLING_PAYMENT_INTENT)',
  })
  @Column({ type: 'varchar', length: 100 })
  source: string;

  @ApiPropertyOptional({
    example: 'Payment intent created',
    description: 'Optional short description of the event',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  message?: string;

  @ApiPropertyOptional({
    example: '{"error":"card_declined"}',
    description: 'Optional extra metadata or error details (JSON)',
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: '2024-01-15T09:00:00.000Z',
    description:
      'Date and time when this billing payment was attempted (in user timezone)',
  })
  @Column({ type: 'timestamptz', nullable: true })
  attemptedAt?: Date;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name of the person who paid (for card payments)',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  paidBy?: string;
}
