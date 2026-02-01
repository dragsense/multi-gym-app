import { Entity, Column, ManyToOne, JoinColumn, Index, OneToMany } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Membership } from './membership.entity';
import { Member } from '../../members/entities/member.entity';
import { Billing } from '../../billings/entities/billing.entity';
import { MemberMembershipHistory } from './member-membership-history.entity';

@Entity('member_memberships')
@Index(['memberId', 'membershipId'], { unique: false }) // Allow multiple memberships per member
export class MemberMembership extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Member ID',
  })
  @Column({ type: 'uuid' })
  memberId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Membership ID',
  })
  @Column({ type: 'uuid' })
  membershipId: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the membership is currently active',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @ApiPropertyOptional({
    example: '2026-02-01T00:00:00.000Z',
    description: 'Scheduled start date for the membership',
  })
  @Column({ type: 'timestamptz', nullable: true })
  startDate?: Date | null;

  @ApiPropertyOptional({
    example: 'America/New_York',
    description: 'Timezone for the membership',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone: string | null;

  // Relations
  @ManyToOne(() => Member, { eager: true })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @ManyToOne(() => Membership, { eager: true })
  @JoinColumn({ name: 'membershipId' })
  membership: Membership;

  @OneToMany(() => MemberMembershipHistory, (history) => history.memberMembership)
  history: MemberMembershipHistory[];
}

