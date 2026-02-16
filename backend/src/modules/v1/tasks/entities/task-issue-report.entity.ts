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
import { EIssueReportStatus, EIssueReportSeverity } from '@shared/enums/task.enum';

// Enums are now in shared/enums/task.enum.ts

@Entity('task_issue_reports')
export class TaskIssueReport extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Button not responding on click',
    description: 'Issue title',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    example: 'The submit button does not respond when clicked in the form',
    description: 'Issue description',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    enum: EIssueReportStatus,
    example: EIssueReportStatus.OPEN,
    description: 'Status of the issue report',
  })
  @Column({
    type: 'enum',
    enum: EIssueReportStatus,
    default: EIssueReportStatus.OPEN,
  })
  status: EIssueReportStatus;

  @ApiProperty({
    enum: EIssueReportSeverity,
    example: EIssueReportSeverity.MEDIUM,
    description: 'Severity of the issue',
  })
  @Column({
    type: 'enum',
    enum: EIssueReportSeverity,
    default: EIssueReportSeverity.MEDIUM,
  })
  severity: EIssueReportSeverity;

  @ApiProperty({
    type: () => Task,
    description: 'Task this issue report belongs to',
  })
  @ManyToOne(() => Task, (task) => task.issueReports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who reported this issue',
  })
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'reportedByUserId' })
  reportedBy?: User;

  @ApiPropertyOptional({
    example: '2024-01-20T15:30:00.000Z',
    description: 'Date when issue was resolved',
  })
  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date;
}

