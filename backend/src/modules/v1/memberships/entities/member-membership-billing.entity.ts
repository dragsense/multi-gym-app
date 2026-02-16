import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { MemberMembership } from './member-membership.entity';
import { Billing } from '../../billings/entities/billing.entity';

@Entity('member_membership_billings')
@Index(['billing'], { unique: true })
export class MemberMembershipBilling extends GeneralBaseEntity {
  @ApiProperty({
    type: () => MemberMembership,
    description: 'Associated member membership',
  })
  @ManyToOne(() => MemberMembership, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberMembershipId' })
  memberMembership: MemberMembership;

  @ApiPropertyOptional({
    example: 'America/New_York',
    description: 'Timezone for the member membership',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone?: string;


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
}

