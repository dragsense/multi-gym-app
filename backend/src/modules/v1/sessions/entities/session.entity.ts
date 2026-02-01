import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { ESessionStatus, ESessionType } from '@shared/enums/session.enum';
import { BeforeInsert, BeforeUpdate } from 'typeorm';
import { ReminderDto } from '@shared/dtos/reminder-dtos';
import { RecurrenceConfigDto } from '@shared/dtos/recurrence-dtos';
import { User } from '@/common/base-user/entities/user.entity';
import { EScheduleFrequency } from '@shared/enums/schedule.enum';
import { Member } from '../../members/entities/member.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { OverrideRecurrenceSession } from './override-recurrence-session.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity('sessions')
export class Session extends GeneralBaseEntity {
  @ApiProperty({ example: 'Morning Workout', description: 'Session title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    example: 'Cardio and strength training session',
    description: 'Session description',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    example: '2024-01-15T09:00:00.000Z',
    description: 'Session start date and time',
  })
  @Column({ type: 'timestamptz' })
  startDateTime: Date;

  @ApiPropertyOptional({
    example: 60,
    description: 'Session duration in minutes',
  })
  @Column({ type: 'int', nullable: true, default: 60 })
  duration?: number;

  @ApiPropertyOptional({
    example: '2024-01-15T10:00:00.000Z',
    description:
      'Session end date and time (auto-calculated from startDateTime + duration)',
  })
  @Column({ type: 'timestamptz', nullable: true })
  endDateTime?: Date;

  @ApiProperty({
    example: 'PERSONAL',
    description: 'Session type',
    enum: ESessionType,
  })
  @Column({ type: 'enum', enum: ESessionType })
  type: ESessionType;

  @ApiPropertyOptional({ example: 50, description: 'Session price' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether to use custom price instead of service offers price',
  })
  @Column({ type: 'boolean', default: false })
  useCustomPrice?: boolean;

  @ApiPropertyOptional({
    example: 75,
    description: 'Custom price (used when useCustomPrice is true)',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  customPrice?: number;

  @ApiPropertyOptional({
    example: 'uuid',
    description: 'Service offer ID for this session',
  })
  @Column({ type: 'uuid', nullable: true })
  serviceOfferId?: string;

  @ApiPropertyOptional({
    example: 'Bring water bottle and towel',
    description: 'Session notes',
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({
    example: 'SCHEDULED',
    description: 'Session status',
    enum: ESessionStatus,
  })
  @Column({
    type: 'enum',
    enum: ESessionStatus,
    default: ESessionStatus.SCHEDULED,
  })
  status: ESessionStatus;

  @ApiProperty({ type: () => Staff, description: 'Associated trainer' })
  @ManyToOne(() => Staff, { eager: true })
  @JoinColumn({ name: 'trainerId' })
  trainer: Staff;

  @ApiProperty({
    type: () => [Member],
    description: 'Associated members (at least one required)',
  })
  @ManyToMany(() => Member, { eager: true })
  @JoinTable({ name: 'session_members_users' })
  members: Member[];

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this session',
    required: false,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @ApiPropertyOptional({
    example: EScheduleFrequency.DAILY,
    description: 'Session recurrence',
    enum: EScheduleFrequency,
  })
  @Column({ type: 'enum', enum: EScheduleFrequency, nullable: true })
  recurrence?: EScheduleFrequency;

  @ApiProperty({
    type: () => ReminderDto,
    description: 'Reminder configuration',
  })
  @Column({ type: 'jsonb', nullable: true })
  reminderConfig?: ReminderDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether reminders are enabled for this session',
  })
  @Column({ type: 'boolean', default: false })
  enableReminder?: boolean;

  @ApiProperty({
    type: () => RecurrenceConfigDto,
    description: 'Recurrence configuration',
  })
  @Column({ type: 'jsonb', nullable: true })
  recurrenceConfig?: RecurrenceConfigDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether recurrence is enabled for this session',
  })
  @Column({ type: 'boolean', default: false })
  enableRecurrence?: boolean;

  //add reccurnce end date
  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'End date of the recurrence for this session',
    required: false,
  })
  @Column({ type: 'timestamptz', nullable: true })
  recurrenceEndDate?: Date;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Parent session ID',
    required: false,
  })
  // Keep child rows when parent is removed; just nullify parentId
  @ManyToOne(() => Session, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent?: Session;

  // When parent is deleted, child should NOT be deleted (no cascade)
  @OneToMany(() => Session, (child) => child.parent, { cascade: false })
  children?: Session[];

  @OneToMany(() => OverrideRecurrenceSession, (override) => override.session)
  overrides?: OverrideRecurrenceSession[];

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Location ID associated with this session',
  })
  @Column({ type: 'uuid', nullable: true })
  locationId?: string;

  @ApiPropertyOptional({
    type: () => Location,
    description: 'Location associated with this session',
  })
  @ManyToOne(() => Location, (location) => location.sessions, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locationId' })
  location?: Location;

  // Automatically calculate endDateTime before insert
  @BeforeInsert()
  @BeforeUpdate()
  beforeInsert() {
    if (!this.startDateTime || !this.duration) {
      return;
    }

    const durationInMilliseconds = this.duration * 60 * 1000;
    const startDateTime = new Date(this.startDateTime);
    this.endDateTime = new Date(
      startDateTime.getTime() + durationInMilliseconds,
    );
  }
}
