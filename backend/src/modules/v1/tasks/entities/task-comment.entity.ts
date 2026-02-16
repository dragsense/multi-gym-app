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

@Entity('task_comments')
export class TaskComment extends GeneralBaseEntity {
  @ApiProperty({
    example: 'This task needs more clarification on the requirements',
    description: 'Comment content',
  })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({
    type: () => Task,
    description: 'Task this comment belongs to',
  })
  @ManyToOne(() => Task, (task) => task.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ApiProperty({
    type: () => User,
    description: 'User who created this comment',
  })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the parent comment if this is a reply',
  })
  @Column({ type: 'uuid', nullable: true })
  parentCommentId?: string;
}

