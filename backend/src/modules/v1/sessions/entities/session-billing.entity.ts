import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Session } from './session.entity';
import { Member } from '../../members/entities/member.entity';
import { Billing } from '../../billings/entities/billing.entity';
import { IsString, IsOptional } from 'class-validator';

@Entity('session_billings')
@Index(['session', 'member'], { unique: true })
export class SessionBilling extends GeneralBaseEntity {
  @ApiProperty({
    type: () => Session,
    description: 'Associated session',
  })
  @ManyToOne(() => Session, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @ApiProperty({
    type: () => Member,
    description: 'Member who initiated the billing',
  })
  @ManyToOne(() => Member, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

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
