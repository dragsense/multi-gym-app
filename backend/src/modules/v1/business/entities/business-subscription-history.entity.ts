import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { BusinessSubscription } from './business-subscription.entity';
import { ESubscriptionStatus } from '@shared/enums/business/subscription.enum';

@Entity('business_subscription_history')
export class BusinessSubscriptionHistory extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Business Subscription ID',
  })
  @Column({ type: 'uuid' })
  businessSubscriptionId: string;

  @ApiProperty({ type: () => BusinessSubscription, description: 'Associated business subscription' })
  @ManyToOne(() => BusinessSubscription, (businessSubscription) => businessSubscription.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessSubscriptionId' })
  businessSubscription: BusinessSubscription;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Subscription status at this point in time',
    enum: ESubscriptionStatus,
  })
  @Column({ type: 'enum', enum: ESubscriptionStatus })
  status: ESubscriptionStatus;

  @ApiProperty({
    example: 'BUSINESS_SUBSCRIPTION_PAYMENT_INTENT',
    description:
      'Source of this history event (e.g. BUSINESS_SUBSCRIPTION_PAYMENT_INTENT, BUSINESS_SUBSCRIPTION_RENEWAL, BUSINESS_SUBSCRIPTION_CANCELLATION)',
  })
  @Column({ type: 'varchar', length: 100 })
  source: string;

  @ApiPropertyOptional({
    example: 'Subscription activated',
    description: 'Optional short description of the event',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  message?: string;

  @ApiPropertyOptional({
    example: '{"billingId":"uuid","paymentIntentId":"pi_xxx"}',
    description: 'Optional extra metadata or error details (JSON)',
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: '2024-01-15T09:00:00.000Z',
    description:
      'Date and time when this subscription status change occurred (in user timezone)',
  })
  @Column({ type: 'timestamptz', nullable: true })
  occurredAt?: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Subscription start date at this point in time',
  })
  @Column({ type: 'timestamptz' })
  startDate: Date;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.999Z',
    description: 'Subscription end date at this point in time',
  })
  @Column({ type: 'timestamptz', nullable: true })
  endDate?: Date;
}
