import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import {
  ESubscriptionStatus,
  ESubscriptionFrequency,
  ESubscriptionType,
  ESubscriptionFeatures,
} from '@shared/enums/business/subscription.enum';

@Entity('subscriptions')
export class Subscription extends GeneralBaseEntity {
  @ApiProperty({ example: 'Premium Plan', description: 'Subscription title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({
    example: 'Access to all premium features.',
    description: 'Subscription description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    example: ESubscriptionStatus.ACTIVE,
    enum: ESubscriptionStatus,
    description: 'Status of the subscription',
  })
  @Column({
    type: 'enum',
    enum: ESubscriptionStatus,
    default: ESubscriptionStatus.ACTIVE,
  })
  status: ESubscriptionStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Sort order for subscription list',
  })
  @Column({ type: 'int', nullable: true, default: 0 })
  sortOrder?: number;

  @ApiPropertyOptional({
    example: '#3366ff',
    description: 'Color code for subscription',
  })
  @Column({ type: 'varchar', length: 7, nullable: true })
  color?: string;

  @ApiProperty({ example: 99.99, description: 'Subscription price' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price?: number;

  @ApiPropertyOptional({ example: 20, description: 'Discount % (0-100)' })
  @Column({ type: 'int', nullable: true, default: 0 })
  discountPercentage?: number;

  @ApiProperty({
    example: [ESubscriptionFrequency.MONTHLY, ESubscriptionFrequency.YEARLY],
    enum: ESubscriptionFrequency,
    description: 'Subscription renewal frequency',
  })
  @Column({
    type: 'enum',
    array: true,
    enum: ESubscriptionFrequency,
    default: [ESubscriptionFrequency.MONTHLY],
  })
  frequency: ESubscriptionFrequency[];

  @ApiProperty({
    example: [
     ESubscriptionFeatures.TASKS,
     ESubscriptionFeatures.SESSIONS,
     ESubscriptionFeatures.ROLES,
     ESubscriptionFeatures.CHECKINS,
     ESubscriptionFeatures.ADVERTISEMENTS,
     ESubscriptionFeatures.CHAT,
     ESubscriptionFeatures.POS,
     ESubscriptionFeatures.EQUIPMENT_RESERVATION,
     ESubscriptionFeatures.LOCATIONS,
    ],
    description: 'Modules included in this subscription',
    enum: ESubscriptionFeatures,
  })
  @Column({
    type: 'enum',
    array: true,
    enum: ESubscriptionFeatures,
  })
  features: ESubscriptionFeatures[];

  @ApiPropertyOptional({
    example: true,
    description: 'Should the subscription auto-renew?',
  })
  @Column({ type: 'boolean', default: false })
  autoRenewal?: boolean;

  @ApiPropertyOptional({
    example: 10,
    description: 'Trial period in days',
  })
  @Column({ type: 'int', nullable: true, default: 0 })
  trialPeriod?: number;

  @ApiProperty({
    type: () => User,
    description: 'User who created this subscription (super-admin)',
  })
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;
}
