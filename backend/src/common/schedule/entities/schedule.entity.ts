import { Entity, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EScheduleStatus,
  EScheduleFrequency,
  EDayOfWeek,
  EIntervalUnit,
} from '@shared/enums/schedule.enum';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('schedules')
export class Schedule extends GeneralBaseEntity {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Tenant ID for multi-tenant database routing',
  })
  @Column({ type: 'uuid', nullable: true })
  @Index('idx_schedule_tenant_id')
  tenantId?: string;

  @ApiProperty({ example: 'Daily Report Generation' })
  @Column({ default: 'Schedule' })
  title?: string;

  @ApiProperty({
    example: 'Automated daily summary of user activity',
    description: 'Optional description shown in UI',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Column({ nullable: true })
  entityId?: string;

  @ApiProperty({ example: 'generateReport' })
  @Column({ nullable: true })
  action: string;

  @ApiProperty({ example: { format: 'pdf' } })
  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  @ApiProperty({ enum: EScheduleFrequency })
  @Column({
    type: 'enum',
    enum: EScheduleFrequency,
    default: EScheduleFrequency.ONCE,
  })
  frequency: EScheduleFrequency;

  @ApiProperty({ example: '2025-10-15T00:00:00Z' })
  @Column({ type: 'date' })
  startDate: Date;

  @ApiProperty({ example: '2025-12-31T00:00:00Z' })
  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @ApiProperty({ example: '09:00' })
  @Column({ nullable: true })
  timeOfDay?: string;

  @ApiProperty({ example: '18:00' })
  @Column({ nullable: true })
  endTime?: string;

  @ApiProperty({
    example: 2,
    description: 'Interval value (e.g., 2 for "every 2 hours")',
  })
  @Column({ type: 'int', nullable: true })
  intervalValue?: number;

  @ApiProperty({ enum: EIntervalUnit, example: EIntervalUnit.HOURS })
  @Column({ type: 'varchar', nullable: true })
  intervalUnit?: EIntervalUnit;

  @ApiProperty({
    example: 120,
    description: 'Interval in minutes (calculated)',
  })
  @Column({ type: 'int', nullable: true })
  interval?: number;

  @ApiProperty({ example: 'America/New_York', description: 'Timezone' })
  @Column({ nullable: true, default: 'UTC' })
  timezone?: string;

  @ApiProperty({
    example: '0 9 * * 1,5',
    description: 'Generated cron expression',
  })
  @Column({ nullable: true })
  cronExpression?: string;

  @ApiProperty({ example: [1, 2, 3, 4, 5], description: 'Days of week' })
  @Column({ type: 'int', array: true, nullable: true })
  weekDays?: EDayOfWeek[];

  @ApiProperty({ example: [1, 15, 30], description: 'Days of month' })
  @Column({ type: 'int', array: true, nullable: true })
  monthDays?: number[];

  @ApiProperty({ example: [1, 6, 12], description: 'Months' })
  @Column({ type: 'int', array: true, nullable: true })
  months?: number[];

  @ApiProperty({ enum: EScheduleStatus })
  @Column({
    type: 'enum',
    enum: EScheduleStatus,
    default: EScheduleStatus.ACTIVE,
  })
  status: EScheduleStatus;

  @ApiProperty({ example: '2025-10-16T00:00:00Z' })
  @Column({ type: 'timestamptz' })
  nextRunDate: Date;

  @ApiProperty({ example: '2025-10-15T09:00:00Z' })
  @Column({ type: 'timestamptz', nullable: true })
  lastRunAt?: Date;

  @ApiProperty({ example: 10, description: 'Total execution count' })
  @Column({ type: 'int', default: 0 })
  executionCount: number;

  @ApiProperty({ example: 8, description: 'Successful execution count' })
  @Column({ type: 'int', default: 0 })
  successCount: number;

  @ApiProperty({ example: 2, description: 'Failed execution count' })
  @Column({ type: 'int', default: 0 })
  failureCount: number;

  @ApiProperty({ example: 'success', description: 'Last execution status' })
  @Column({ nullable: true })
  lastExecutionStatus?: string;

  @ApiProperty({
    example: 'Connection timeout',
    description: 'Last error message if failed',
  })
  @Column({ type: 'text', nullable: true })
  lastErrorMessage?: string;

  @ApiProperty({
    example: [{ executedAt: '2025-10-15T09:00:00Z', status: 'success' }],
    description: 'Execution history (last 50 executions)',
  })
  @Column({ type: 'jsonb', nullable: true })
  executionHistory?: Array<{
    executedAt: Date;
    status: 'success' | 'failed';
    errorMessage?: string;
  }>;

  @ApiProperty({ example: true, description: 'Whether to retry on failure' })
  @Column({ type: 'boolean', default: true })
  retryOnFailure: boolean;

  @ApiProperty({ example: 3, description: 'Maximum number of retries' })
  @Column({ type: 'int', default: 1 })
  maxRetries: number;

  @ApiProperty({ example: 0, description: 'Current retry count' })
  @Column({ type: 'int', default: 0 })
  currentRetries: number;

  @ApiProperty({ example: 5, description: 'Delay between retries in minutes' })
  @Column({ type: 'int', default: 15 })
  retryDelayMinutes: number;
}
