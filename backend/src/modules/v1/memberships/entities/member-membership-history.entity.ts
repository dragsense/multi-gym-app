import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { MemberMembership } from './member-membership.entity';
import { EMembershipStatus } from '@shared/enums/membership.enum';

@Entity('member_membership_history')
export class MemberMembershipHistory extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Member Membership ID',
  })
  @Column({ type: 'uuid' })
  memberMembershipId: string;

  @ApiProperty({ type: () => MemberMembership, description: 'Associated member membership' })
  @ManyToOne(() => MemberMembership, (memberMembership) => memberMembership.history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memberMembershipId' })
  memberMembership: MemberMembership;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Membership status at this point in time',
    enum: EMembershipStatus,
  })
  @Column({ type: 'enum', enum: EMembershipStatus })
  status: EMembershipStatus;

  @ApiProperty({
    example: 'MEMBERSHIP_PAYMENT_INTENT',
    description:
      'Source of this history event (e.g. MEMBERSHIP_PAYMENT_INTENT, MEMBERSHIP_RENEWAL, MEMBERSHIP_CANCELLATION)',
  })
  @Column({ type: 'varchar', length: 100 })
  source: string;

  @ApiPropertyOptional({
    example: 'Membership activated',
    description: 'Optional short description of the event',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  message?: string;

  @ApiPropertyOptional({
    example: '{"billingId":"uuid","paymentIntentId":"pi_xxx"}',
    description: 'Optional extra metadata or error details (JSON)',
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: '2024-01-15T09:00:00.000Z',
    description:
      'Date and time when this membership status change occurred (in user timezone)',
  })
  @Column({ type: 'timestamptz', nullable: true })
  occurredAt?: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Membership start date at this point in time',
  })
  @Column({ type: 'timestamptz' })
  startDate: Date;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.999Z',
    description: 'Membership end date at this point in time',
  })
  @Column({ type: 'timestamptz', nullable: true })
  endDate?: Date;
}

