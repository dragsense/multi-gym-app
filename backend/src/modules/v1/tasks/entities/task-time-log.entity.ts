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

@Entity('task_time_logs')
export class TaskTimeLog extends GeneralBaseEntity {
  @ApiProperty({
    type: () => Task,
    description: 'Task this time log belongs to',
  })
  @ManyToOne(() => Task, (task) => task.timeLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ApiProperty({
    type: () => User,
    description: 'User who logged this time',
  })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    example: 120,
    description: 'Time spent in minutes',
  })
  @Column({ type: 'int' })
  duration: number;

  @ApiPropertyOptional({
    example: 'Worked on API integration',
    description: 'Description of work done',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Start time of the work session',
  })
  @Column({ type: 'timestamptz' })
  startTime: Date;
}

