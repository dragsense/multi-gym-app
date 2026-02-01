import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { EBillingFrequency, EPaymentPreference, EMembershipExpiry } from '@shared/enums/membership.enum';
import { Door } from '../../locations/doors/entities/door.entity';

@Entity('memberships')
export class Membership extends GeneralBaseEntity {
  @ApiProperty({ example: 'Premium Plan', description: 'Membership title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    example: 'Premium membership with full access',
    description: 'Membership description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the membership is enabled',
  })
  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @ApiProperty({
    example: 1,
    description: 'Sort order for display',
  })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty({
    example: '#FF5733',
    description: 'Color code for the membership',
  })
  @Column({ type: 'varchar', length: 7, nullable: true })
  color?: string;

  @ApiProperty({
    example: 99.99,
    description: 'Membership price',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @ApiProperty({
    example: 1,
    description: 'Price period in months',
  })
  @Column({ type: 'int', nullable: true })
  pricePeriod?: number;

  @ApiProperty({
    example: 99.99,
    description: 'Calculated price based on price, pricePeriod, and billingFrequency',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  calculatedPrice?: number;

  @ApiProperty({
    example: 50.00,
    description: 'Signup fee',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  signupFee?: number;

  @ApiProperty({
    example: 100.00,
    description: 'Annual fee',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  annualFee?: number;

  @ApiProperty({
    example: 25.00,
    description: 'Cancellation fee',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  cancellationFee?: number;

  @ApiProperty({
    example: 10,
    description: 'Discount percentage',
  })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  discountPercentage?: number;

  @ApiProperty({
    example: 'MONTHLY',
    description: 'Billing frequency',
    enum: EBillingFrequency,
  })
  @Column({ type: 'enum', enum: EBillingFrequency, nullable: true })
  billingFrequency?: EBillingFrequency;

  @ApiProperty({
    example: 'AFTER_1_YEAR',
    description: 'Membership expiry period',
    enum: EMembershipExpiry,
  })
  @Column({ type: 'enum', enum: EMembershipExpiry, nullable: true })
  expiry?: EMembershipExpiry;

  @ApiProperty({
    example: ['CASH', 'ONLINE'],
    description: 'Payment preferences (multiple)',
    enum: EPaymentPreference,
    isArray: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  paymentPreference?: EPaymentPreference[];

  @ApiProperty({
    example: 1,
    description: 'Billing start day (1-31)',
  })
  @Column({ type: 'int', nullable: true })
  billingStartDay?: number;

  @ApiProperty({
    example: true,
    description: 'Whether to prorate charges',
  })
  @Column({ type: 'boolean', default: false })
  prorate: boolean;

  @ApiProperty({
    example: '15-03',
    description: 'Annual fee date in DD-MM format',
  })
  @Column({ type: 'varchar', length: 5, nullable: true })
  annualFeeDate?: string;

  @ApiProperty({
    example: { allowCancellation: true, autoRenew: false },
    description: 'Additional settings as JSON',
  })
  @Column({ type: 'jsonb', nullable: true })
  settings?: Record<string, any>;

  @ApiProperty({
    example: [{ id: 'uuid', name: 'Morning Hours', startTime: '06:00', endTime: '12:00' }],
    description: 'Associated access hours as JSON array',
  })
  @Column({ type: 'jsonb', nullable: true })
  accessHours?: Record<string, any>[];

  @ApiProperty({
    example: [{ id: 'uuid', name: 'Gym Access', description: 'Full gym access' }],
    description: 'Associated access features as JSON array',
  })
  @Column({ type: 'jsonb', nullable: true })
  accessFeatures?: Record<string, any>[];

  @ApiPropertyOptional({
    example: 'Terms and conditions for this membership',
    description: 'Terms and conditions in HTML format',
  })
  @Column({ type: 'text', nullable: true })
  termsAndConditions?: string;

  @ApiPropertyOptional({
    type: () => [Door],
    description: 'Doors associated with this membership',
  })
  @ManyToMany(() => Door, (door) => door.memberships, { nullable: true, cascade: false })
  @JoinTable({
    name: 'membership_doors',
    joinColumn: { name: 'membershipId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'doorId', referencedColumnName: 'id' },
  })
  doors?: Door[];
}

