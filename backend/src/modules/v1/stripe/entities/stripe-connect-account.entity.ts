import { GeneralBaseEntity } from '@/common/entities';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Business } from '@/modules/v1/business/entities/business.entity';

@Entity('stripe_connect_accounts')
export class StripeConnectAccount extends GeneralBaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  stripeAccountId: string;

  @Column({ type: 'varchar', length: 10, default: 'express' })
  type: 'express' | 'standard';

  @Column({ type: 'varchar', length: 5, default: 'US' })
  country: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'boolean', default: false })
  chargesEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  detailsSubmitted: boolean;

  @Column({ type: 'boolean', default: false })
  payoutsEnabled: boolean;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'uuid' })
  businessId: string;

  get isComplete(): boolean {
    return this.detailsSubmitted && this.chargesEnabled;
  }
}
