import { Entity, Column, OneToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';

@Entity('stripe_customers')
@Unique(['userId'])
export class StripeCustomer extends GeneralBaseEntity {
  @ApiProperty({
    example: 'cus_1234567890',
    description: 'Stripe customer ID',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  stripeCustomerId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the user',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Email address of the customer',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name of the customer',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @ApiPropertyOptional({
    example: 'US',
    description: 'Country code',
  })
  @Column({ type: 'varchar', length: 5, nullable: true })
  country?: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Customer status in Stripe',
  })
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status?: string;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the customer was created in Stripe',
  })
  @Column({ type: 'timestamptz', nullable: true })
  stripeCreatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata stored in Stripe',
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, string>;

  @ApiProperty({ type: () => User, description: 'Associated user' })
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
