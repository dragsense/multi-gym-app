import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { EReferralLinkStatus, EReferralLinkType } from '@shared/enums';

@Entity('referral_links')
export class ReferralLink extends GeneralBaseEntity {
  @ApiProperty({
    example: 'My Referral Link',
    description: 'Referral link title',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    example: 'https://myapp.com/ref/abc123',
    description: 'Auto-generated referral link URL',
  })
  @Column({ type: 'varchar', length: 500, unique: true })
  linkUrl: string;

  @ApiProperty({
    example: 'abc123',
    description: 'Auto-generated unique referral code',
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  referralCode: string;

  @ApiProperty({
    example: 'CLIENT',
    description: 'Referral link type',
    enum: EReferralLinkType,
  })
  @Column({
    type: 'enum',
    enum: EReferralLinkType,
    default: EReferralLinkType.USER,
  })
  type: EReferralLinkType;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Referral link status',
    enum: EReferralLinkStatus,
  })
  @Column({
    type: 'enum',
    enum: EReferralLinkStatus,
    default: EReferralLinkStatus.ACTIVE,
  })
  status: EReferralLinkStatus;

  @ApiPropertyOptional({
    example: 'Share this link to get referrals',
    description: 'Referral link description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    example: 0,
    description: 'Number of successful referrals from this link',
  })
  @Column({ type: 'int', default: 0 })
  referralCount: number;

  @ApiProperty({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Link expiration date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ example: 100, description: 'Maximum number of uses allowed' })
  @Column({ type: 'int', nullable: true })
  maxUses?: number;

  @ApiProperty({ example: 0, description: 'Current number of uses' })
  @Column({ type: 'int', default: 0 })
  currentUses: number;

  @ApiProperty({ type: () => User, description: 'Link creator' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;
}
