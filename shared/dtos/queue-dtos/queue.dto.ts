import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationMetaDto } from '../common/pagination.dto';
import { EQueueJobStatus, EQueueStatus } from '../../enums/queue.enum';
import { FieldOptions, FieldType } from '../../decorators';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../common/list-query.dto';

export class QueueJobDto {
  @ApiProperty({ example: '123', description: 'Job ID' })
  id: string;

  @ApiProperty({ example: 'send-email', description: 'Job name' })
  name: string;

  @ApiProperty({ example: { action: 'send-email', data: { email: 'test@example.com' } }, description: 'Job data' })
  data: any;

  @ApiProperty({ example: 50, description: 'Job progress percentage' })
  progress: number;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'When job was processed' })
  processedOn?: number;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'When job finished' })
  finishedOn?: number;

  @ApiPropertyOptional({ example: 'Connection timeout', description: 'Failure reason if job failed' })
  failedReason?: string;

  @ApiProperty({ enum: EQueueJobStatus, example: EQueueJobStatus.WAITING, description: 'Current job status' })
  status: EQueueJobStatus;
}

export class QueueStatsDto {
  @ApiProperty({ example: 5, description: 'Number of waiting jobs' })
  waiting: number;

  @ApiProperty({ example: 2, description: 'Number of active jobs' })
  active: number;

  @ApiProperty({ example: 100, description: 'Number of completed jobs' })
  completed: number;

  @ApiProperty({ example: 3, description: 'Number of failed jobs' })
  failed: number;

  @ApiProperty({ example: 1, description: 'Number of delayed jobs' })
  delayed: number;

  @ApiProperty({ example: 111, description: 'Total number of jobs' })
  total: number;
}

export class QueueDto {
  @ApiProperty({ example: 'schedule', description: 'Queue name' })
  name: string;

  @ApiProperty({ type: QueueStatsDto, description: 'Queue statistics' })
  stats: QueueStatsDto;

  @ApiProperty({ example: true, description: 'Whether queue is ready' })
  isReady: boolean;
}


export class QueueListDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: EQueueStatus,
    example: EQueueStatus.WAITING,
    description: 'Filter by job status'
  })
  @IsOptional()
  @IsEnum(EQueueStatus)
  @FieldType('select', false)
  @FieldOptions(Object.values(EQueueStatus).map(v => ({ value: v, label: v })))
  status?: EQueueStatus;
}

export class JobListDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: EQueueJobStatus,
    example: EQueueJobStatus.WAITING,
    description: 'Filter by job status'
  })
  @IsOptional()
  @IsEnum(EQueueJobStatus)
  @FieldType('select', false)
  @FieldOptions(Object.values(EQueueJobStatus).map(v => ({ value: v, label: v })))
  status?: EQueueJobStatus;
}

export class QueueJobsPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [QueueJobDto] })
  @Type(() => QueueJobDto)
  data: QueueJobDto[];
}

export class QueueListPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [QueueDto] })
  @Type(() => QueueDto)
  data: QueueDto[];
}



export class JobPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [QueueJobDto] })
  @Type(() => QueueJobDto)
  data: QueueJobDto[];
}