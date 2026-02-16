import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Business } from './business.entity';
import { Subscription } from '../subscription/entities/subscription.entity';
import { BusinessSubscriptionHistory } from './business-subscription-history.entity';
import { ESubscriptionFrequency } from '@shared/enums/business/subscription.enum';

@Entity('business_subscriptions')
@Index(['businessId', 'subscriptionId'], { unique: false }) // Allow multiple subscriptions per business
export class BusinessSubscription extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Business ID',
  })
  @Column({ type: 'uuid' })
  businessId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Subscription ID',
  })
  @Column({ type: 'uuid' })
  subscriptionId: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the subscription is currently active',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isActive: boolean;


  // Relations
  @ManyToOne(() => Business, { eager: true })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @ManyToOne(() => Subscription, { eager: true })
  @JoinColumn({ name: 'subscriptionId' })
  subscription: Subscription;

  @OneToMany(() => BusinessSubscriptionHistory, (history) => history.businessSubscription)
  history: BusinessSubscriptionHistory[];
}
