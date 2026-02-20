import { Entity, Column, OneToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';

/**
 * Paysafe Payments API customer (paymenthub/v1/customers) mapping per user.
 * Stored per-tenant via EntityRouterService (same pattern as StripeCustomer).
 */
@Entity('paysafe_customers')
@Unique(['userId'])
export class PaysafeCustomer extends GeneralBaseEntity {
  @ApiProperty({ description: 'Paysafe customer id (paymenthub/v1/customers/{id})' })
  @Column({ type: 'varchar', length: 255, unique: true })
  paysafeCustomerId: string;

  @ApiProperty({ description: 'User id' })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiPropertyOptional({ description: 'Merchant customer id used when creating Paysafe customer' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  merchantCustomerId?: string | null;

  @ApiPropertyOptional({ description: 'Default saved payment handle token (multi-use)' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  defaultPaymentHandleToken?: string | null;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}

