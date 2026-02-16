import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Business } from './business.entity';
import { Billing } from '../../billings/entities/billing.entity';
import { Profile } from '../../users/profiles/entities/profile.entity';
import { ESubscriptionFrequency } from '@shared/enums';
import { BusinessSubscription } from './business-subscription.entity';

@Entity('business_subscription_billings')
@Index(['billing'], { unique: true })
export class BusinessSubscriptionBilling extends GeneralBaseEntity {
    @ApiProperty({
        type: () => BusinessSubscription,
        description: 'Associated business subscription',
    })
    @ManyToOne(() => BusinessSubscription, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'businessSubscriptionId' })
    businessSubscription: BusinessSubscription;

    @ApiProperty({
        type: () => Billing,
        description: 'Associated billing record',
    })
    @ManyToOne(() => Billing, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'billingId' })
    billing: Billing;

    @ApiPropertyOptional({
        example: '2024-01-15T09:00:00.000Z',
        description: 'Date when billing was initiated',
    })
    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    initiatedAt: Date;


    @ApiPropertyOptional({
        example: 'America/New_York',
        description: 'Timezone for the business subscription',
    })
    @Column({ type: 'varchar', length: 100, nullable: true })
    timezone?: string;

    @ApiProperty({
        example: ESubscriptionFrequency.MONTHLY,
        enum: ESubscriptionFrequency,
        description: 'Frequency of the subscription',
    })
    @Column({
        type: 'enum',
        enum: ESubscriptionFrequency,
        default: ESubscriptionFrequency.MONTHLY,
    })
    selectedFrequency: ESubscriptionFrequency;

}
