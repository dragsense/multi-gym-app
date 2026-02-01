import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { EBillingType } from '@shared/enums/billing.enum';
import { User } from '@/common/base-user/entities/user.entity';
import { EScheduleFrequency } from '@shared/enums/schedule.enum';
import { ReminderDto } from '@shared/dtos/reminder-dtos';
import { BillingLineItem } from './billing-line-item.entity';
import { BillingHistory } from './billing-history.entity';

@Entity('billings')
export class Billing extends GeneralBaseEntity {
  @ApiProperty({
    example: 'INV-20241218-A3B7C',
    description: 'Unique invoice reference number',
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  invoiceRef: string;

  @ApiProperty({
    example: 'Session Payment - Morning Workout',
    description: 'Billing title',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    example: 'Payment for personal training session',
    description: 'Billing description',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 50, description: 'Billing amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    example: '2024-01-10T09:00:00.000Z',
    description: 'Billing issue date',
  })
  @Column({ type: 'timestamptz' })
  issueDate: Date;

  @ApiProperty({
    example: '2024-01-15T09:00:00.000Z',
    description: 'Billing due date',
  })
  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @ApiProperty({
    example: 'SESSION',
    description: 'Billing type',
    enum: EBillingType,
  })
  @Column({ type: 'enum', enum: EBillingType })
  type: EBillingType;

  @ApiPropertyOptional({
    example: EScheduleFrequency.MONTHLY,
    description: 'Billing recurrence',
    enum: EScheduleFrequency,
  })
  @Column({ type: 'enum', enum: EScheduleFrequency, nullable: true })
  recurrence?: EScheduleFrequency;

  @ApiPropertyOptional({
    example: 'Payment notes and instructions',
    description: 'Billing notes',
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({ type: () => User, description: 'Associated recipient' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'recipientUserId' })
  recipientUser: User;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this billing',
    required: false,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @ApiProperty({
    type: () => ReminderDto,
    description: 'Reminder configuration',
  })
  @Column({ type: 'jsonb', nullable: true })
  reminderConfig?: ReminderDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether reminders are enabled for this billing',
  })
  @Column({ type: 'boolean', default: false })
  enableReminder?: boolean;

  @ApiProperty({
    example: 'pm_123',
    description: 'Associated payment method ID',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentMethodId: string;

  @ApiPropertyOptional({
    example: 'pi_1234567890',
    description: 'Stripe payment intent ID',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  paymentIntentId?: string;

  @OneToMany(() => BillingLineItem, (lineItem) => lineItem.billing, {
    cascade: true,
  })
  lineItems: BillingLineItem[];

  @ApiPropertyOptional({
    type: () => [BillingHistory],
    description: 'History of billing status changes and payment attempts',
  })
  @OneToMany(() => BillingHistory, (history) => history.billing, {
    cascade: ['insert'],
  })
  history?: BillingHistory[];

  @ApiPropertyOptional({
    example: false,
    description:
      'Whether billing can be marked as paid manually (cash payment)',
  })
  @Column({ type: 'boolean', default: false })
  isCashable?: boolean;
}
