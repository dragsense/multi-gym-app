import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { ETaskStatus, ETaskPriority } from '@shared/enums/task.enum';
import { EScheduleFrequency } from '@shared/enums/schedule.enum';
import { RecurrenceConfigDto } from '@shared/dtos/recurrence-dtos';
import { TaskComment } from './task-comment.entity';
import { TaskIssueReport } from './task-issue-report.entity';
import { TaskTimeLog } from './task-time-log.entity';
import { TaskActivityLog } from './task-activity-log.entity';
import { OverrideRecurrenceTask } from './override-recurrence-task.entity';
import { Location } from '../../locations/entities/location.entity';
import { Door } from '../../locations/doors/entities/door.entity';

@Entity('tasks')
export class Task extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Complete project documentation',
    description: 'Task title',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({
    example: 'Write comprehensive documentation for the API endpoints',
    description: 'Task description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    enum: ETaskStatus,
    example: ETaskStatus.TODO,
    description: 'Current status of the task',
  })
  @Column({
    type: 'enum',
    enum: ETaskStatus,
    default: ETaskStatus.TODO,
  })
  status: ETaskStatus;

  @ApiProperty({
    enum: ETaskPriority,
    example: ETaskPriority.MEDIUM,
    description: 'Priority level of the task',
  })
  @Column({
    type: 'enum',
    enum: ETaskPriority,
    default: ETaskPriority.MEDIUM,
  })
  priority: ETaskPriority;

  @ApiProperty({
    example: '2024-01-15T09:00:00.000Z',
    description: 'Task start date and time',
  })
  @Column({ type: 'timestamptz' })
  startDateTime: Date;

  @ApiProperty({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Due date for the task',
  })
  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User assigned to this task',
  })
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo?: User;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this task',
  })
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @ApiPropertyOptional({
    example: ['tag1', 'tag2'],
    description: 'Tags for categorizing tasks',
  })
  @Column({ type: 'text', array: true, default: [] })
  tags?: string[];

  @ApiPropertyOptional({
    example: 50,
    description: 'Progress percentage (0-100)',
  })
  @Column({ type: 'int', default: 0 })
  progress: number;

  @ApiPropertyOptional({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Date when task was started',
  })
  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @ApiPropertyOptional({
    example: '2024-01-20T15:30:00.000Z',
    description: 'Date when task was completed',
  })
  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @OneToMany(() => TaskComment, (comment) => comment.task, {
    cascade: true,
  })
  comments?: TaskComment[];

  @OneToMany(() => TaskIssueReport, (issueReport) => issueReport.task, {
    cascade: true,
  })
  issueReports?: TaskIssueReport[];

  @OneToMany(() => TaskTimeLog, (timeLog) => timeLog.task, {
    cascade: true,
  })
  timeLogs?: TaskTimeLog[];

  @OneToMany(() => TaskActivityLog, (activityLog) => activityLog.task, {
    cascade: true,
  })
  activityLogs?: TaskActivityLog[];

  @OneToMany(() => OverrideRecurrenceTask, (override) => override.task)
  overrides?: OverrideRecurrenceTask[];

  @ApiPropertyOptional({
    example: true,
    description: 'Whether recurrence is enabled for this task',
  })
  @Column({ type: 'boolean', default: false })
  enableRecurrence?: boolean;

  @ApiProperty({
    type: () => RecurrenceConfigDto,
    description: 'Recurrence configuration',
  })
  @Column({ type: 'jsonb', nullable: true })
  recurrenceConfig?: RecurrenceConfigDto;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'End date of the recurrence for this task',
    required: false,
  })
  @Column({ type: 'timestamptz', nullable: true })
  recurrenceEndDate?: Date;

  @ApiPropertyOptional({
    type: () => Task,
    description: 'Parent task if this is a recurring instance',
  })
  @ManyToOne(() => Task, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent?: Task;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Location ID associated with this task',
  })
  @Column({ type: 'uuid', nullable: true })
  locationId?: string;

  @ApiPropertyOptional({
    type: () => Location,
    description: 'Location associated with this task',
  })
  @ManyToOne(() => Location, (location) => location.tasks, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locationId' })
  location?: Location;
}

