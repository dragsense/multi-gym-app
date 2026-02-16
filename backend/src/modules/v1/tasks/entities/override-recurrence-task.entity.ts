import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { ETaskStatus, ETaskPriority } from '@shared/enums/task.enum';
import { Task } from './task.entity';
import { User } from '@/common/base-user/entities/user.entity';

@Entity('override_recurrence_tasks')
export class OverrideRecurrenceTask extends GeneralBaseEntity {
  @ApiProperty({
    type: () => Task,
    description: 'Parent recurring task',
  })
  @ManyToOne(() => Task, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ApiPropertyOptional({
    example: '2024-01-15T09:00:00.000Z',
    description: 'Overridden task date',
  })
  @Column({ type: 'timestamptz' })
  date?: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T09:00:00.000Z',
    description: 'Overridden task start date and time',
  })
  @Column({ type: 'timestamptz', nullable: true })
  startDateTime?: Date;

  @ApiPropertyOptional({
    type: () => User,
    description: 'Overridden assigned user',
  })
  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo?: User;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this override is marked as deleted',
  })
  @Column({ type: 'boolean', default: false })
  isDeleted?: boolean;

  @ApiPropertyOptional({
    example: ETaskStatus.TODO,
    description: 'Task status',
    enum: ETaskStatus,
  })
  @Column({
    type: 'enum',
    enum: ETaskStatus,
    default: ETaskStatus.TODO,
  })
  status: ETaskStatus;

  @ApiPropertyOptional({
    example: 'Client requested priority change',
    description: 'Reason for change (will be appended to notes)',
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Other overridden task fields stored as JSON',
  })
  @Column({ type: 'jsonb', nullable: true })
  overrideData?: {
    title?: string;
    description?: string;
    priority?: ETaskPriority;
    progress?: number;
    tags?: string[];
    dueDate?: string | Date;
    [key: string]: unknown;
  };
}

