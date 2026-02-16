import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import {
  ESessionStatus,
  ESessionType,
  EUpdateSessionScope,
} from '@shared/enums/session.enum';
import { Session } from './session.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Member } from '../../members/entities/member.entity';

@Entity('override_recurrence_sessions')
export class OverrideRecurrenceSession extends GeneralBaseEntity {
  @ApiProperty({
    type: () => Session,
    description: 'Parent recurring session',
  })
  @ManyToOne(() => Session, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: Session;

  @ApiPropertyOptional({
    example: '2024-01-15T09:00:00.000Z',
    description: 'Overridden session date',
  })
  @Column({ type: 'timestamptz' })
  date?: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T09:00:00.000Z',
    description: 'Overridden session start date and time',
  })
  @Column({ type: 'timestamptz', nullable: true })
  startDateTime?: Date;

  @ApiProperty({ type: () => Staff, description: 'Associated trainer' })
  @ManyToOne(() => Staff, { eager: true, nullable: true })
  @JoinColumn({ name: 'trainerId' })
  trainer?: Staff;

  @ApiProperty({
    type: () => [Member],
    description: 'Associated members',
  })
  @ManyToMany(() => Member, { eager: true, nullable: true })
  @JoinTable({ name: 'override_recurrence_session_clients' })
  members?: Member[];

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this override is marked as deleted',
  })
  @Column({ type: 'boolean', default: false })
  isDeleted?: boolean;

  @ApiPropertyOptional({
    example: ESessionStatus.SCHEDULED,
    description: 'Session status',
    enum: ESessionStatus,
  })
  @Column({
    type: 'enum',
    enum: ESessionStatus,
    default: ESessionStatus.SCHEDULED,
  })
  status: ESessionStatus;

  @ApiPropertyOptional({
    example: EUpdateSessionScope.THIS,
    description: 'Update scope',
    enum: EUpdateSessionScope,
  })
  @Column({
    type: 'enum',
    enum: EUpdateSessionScope,
    default: EUpdateSessionScope.ALL,
  })
  updateScope?: EUpdateSessionScope;

  @ApiPropertyOptional({
    example: 'Client requested time change',
    description: 'Reason for date/time change (will be appended to notes)',
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Other overridden session fields stored as JSON',
  })
  @Column({ type: 'jsonb', nullable: true })
  overrideData?: {
    title?: string;
    description?: string;
    duration?: number;
    endDateTime?: string;
    type?: ESessionType;
    location?: string;
    price?: number;
    notes?: string;
    [key: string]: unknown;
  };
}
