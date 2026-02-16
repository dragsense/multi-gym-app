import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { ReferralLink } from '@/modules/v1/referral-links/entities/referral-link.entity';
import { ERewardType, ERewardStatus } from '../enums/reward.enum';

@Entity('reward_points')
export class RewardPoints extends GeneralBaseEntity {
  @ApiProperty({ example: 100, description: 'Number of reward points' })
  @Column({ type: 'int', default: 0 })
  points: number;

  @ApiProperty({
    example: 'REFERRAL_BONUS',
    description: 'Type of reward',
    enum: ERewardType,
  })
  @Column({ type: 'enum', enum: ERewardType })
  type: ERewardType;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Reward status',
    enum: ERewardStatus,
  })
  @Column({ type: 'enum', enum: ERewardStatus, default: ERewardStatus.ACTIVE })
  status: ERewardStatus;

  @ApiPropertyOptional({
    example: 'Referral bonus for bringing 3 users',
    description: 'Reward description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ example: 1, description: 'User who earned the reward' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiPropertyOptional({
    example: 1,
    description: 'Referral link that generated this reward',
  })
  @ManyToOne(() => ReferralLink, { nullable: true })
  @JoinColumn({ name: 'referralLinkId' })
  referralLink?: ReferralLink;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Referred user ID',
  })
  @Column({ type: 'varchar', nullable: true })
  referredUserId?: string;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Reward expiration date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this reward can be redeemed',
  })
  @Column({ type: 'boolean', default: true })
  isRedeemable: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Points already redeemed from this reward',
  })
  @Column({ type: 'int', default: 0 })
  redeemedPoints: number;
}
