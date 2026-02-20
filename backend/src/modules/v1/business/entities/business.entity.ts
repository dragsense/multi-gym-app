import { Entity, Column, ManyToOne, OneToOne, Index, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { StripeConnectAccount } from '@/modules/v1/stripe/entities/stripe-connect-account.entity';
import { PaymentProcessor } from '@/common/payment-processors/entities/payment-processor.entity';


@Entity('businesses')
export class Business extends GeneralBaseEntity {
    @ApiProperty({ example: 'My Gym', description: 'Name of the business' })
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @ApiProperty({ example: 'mygym', description: 'Subdomain for the business' })
    @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
    @Index('idx_business_subdomain', { unique: true })
    subdomain: string;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Tenant ID for database routing' })
    @Column({ type: 'uuid', nullable: true, unique: true })
    @Index('idx_business_tenant_id', { unique: true })
    tenantId: string;

    @ApiProperty({ type: () => User, description: 'User who owns this business' })
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ApiPropertyOptional({ example: 'acct_123456', description: 'Stripe Connect account ID' })
    @Column({ type: 'varchar', length: 255, nullable: true })
    stripeConnectAccountId: string | null;

    @ApiPropertyOptional({ type: () => StripeConnectAccount, description: 'Stripe Connect account' })
    @OneToOne(() => StripeConnectAccount, (sc) => sc.business, { nullable: true, eager: false })
    stripeConnectAccount: StripeConnectAccount | null;

    @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'Payment processor ID (Stripe, Paysafe, etc.)' })
    @Column({ type: 'uuid', nullable: true })
    paymentProcessorId: string | null;

    @ApiPropertyOptional({ type: () => PaymentProcessor, description: 'Payment processor this business uses' })
    @ManyToOne(() => PaymentProcessor, { nullable: true, eager: false })
    @JoinColumn({ name: 'paymentProcessorId' })
    paymentProcessor: PaymentProcessor | null;
}
