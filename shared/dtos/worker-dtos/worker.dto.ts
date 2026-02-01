import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationMetaDto } from '../common/pagination.dto';
import { EWorkerStatus } from '../../enums/worker.enum';
import { FieldOptions, FieldType } from '../../decorators';
import { IsEnum, IsOptional, IsString, IsNumber, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ListQueryDto } from '../common/list-query.dto';

export class WorkerDto {
  @ApiProperty({ example: '123', description: 'Worker ID' })
  id: string;

  @ApiProperty({ example: 'email-processor', description: 'Worker name' })
  name: string;

  @ApiProperty({ enum: EWorkerStatus, example: EWorkerStatus.RUNNING, description: 'Current worker status' })
  status: EWorkerStatus;

  @ApiProperty({ example: 75, description: 'Worker progress percentage' })
  progress: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'When worker started' })
  startTime: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update time' })
  lastUpdate: string;

  @ApiPropertyOptional({ example: { email: 'test@example.com' }, description: 'Worker data' })
  data?: any;
}

export class WorkerListDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: EWorkerStatus,
    example: EWorkerStatus.RUNNING,
    description: 'Filter by worker status'
  })
  @IsOptional()
  @IsEnum(EWorkerStatus)
  @FieldType('select', false)
  @FieldOptions(Object.values(EWorkerStatus).map(v => ({ value: v, label: v })))
  status?: EWorkerStatus;
}

export class WorkerListPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [WorkerDto] })
  @Type(() => WorkerDto)
  data: WorkerDto[];
}
