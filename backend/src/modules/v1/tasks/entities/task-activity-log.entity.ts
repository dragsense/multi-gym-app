import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { Task } from './task.entity';

@Entity('task_activity_logs')
export class TaskActivityLog extends GeneralBaseEntity {
  @ApiProperty({
    type: () => Task,
    description: 'Task this activity log belongs to',
  })
  @ManyToOne(() => Task, (task) => task.activityLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who performed the activity',
  })
  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ApiProperty({
    example: 'Updated task status from TODO to IN_PROGRESS',
    description: 'Activity description',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    example: 'status_update',
    description: 'Type of activity (e.g., status_update, progress_update, assignment_change)',
  })
  @Column({ type: 'varchar', length: 100 })
  activityType: string;

  @ApiPropertyOptional({
    example: { field: 'status', oldValue: 'TODO', newValue: 'IN_PROGRESS' },
    description: 'Metadata about what changed',
  })
  @Column({ type: 'jsonb', nullable: true })
  changes?: Record<string, any>;

  @ApiPropertyOptional({
    example: ['status', 'progress'],
    description: 'List of fields that were updated',
  })
  @Column({ type: 'text', array: true, nullable: true })
  updatedFields?: string[];
}

