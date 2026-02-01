import { GeneralBaseEntity } from '@/common/entities';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from '@/common/base-user/entities/user.entity';

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

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  get isComplete(): boolean {
    return this.detailsSubmitted && this.chargesEnabled;
  }
}
