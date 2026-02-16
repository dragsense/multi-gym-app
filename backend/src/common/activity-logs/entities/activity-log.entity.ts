import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import {
  EActivityType,
  EActivityStatus,
} from '@shared/enums/activity-log.enum';

@Entity('activity_logs')
export class ActivityLog extends GeneralBaseEntity {
  @ApiProperty({
    example: 'User logged in successfully',
    description: 'Activity description',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    enum: EActivityType,
    example: EActivityType.LOGIN,
    description: 'Type of activity performed',
  })
  @Column({
    type: 'enum',
    enum: EActivityType,
    default: EActivityType.READ,
  })
  type: EActivityType;

  @ApiProperty({
    enum: EActivityStatus,
    example: EActivityStatus.SUCCESS,
    description: 'Status of the activity',
  })
  @Column({
    type: 'enum',
    enum: EActivityStatus,
    default: EActivityStatus.SUCCESS,
  })
  status: EActivityStatus;

  @ApiPropertyOptional({
    example: '192.168.1.1',
    description: 'IP address of the user',
  })
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @ApiPropertyOptional({
    example: 'Mozilla/5.0...',
    description: 'User agent string',
  })
  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @ApiPropertyOptional({
    example: '/api/v1/users',
    description: 'API endpoint accessed',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  endpoint?: string;

  @ApiPropertyOptional({ example: 'POST', description: 'HTTP method used' })
  @Column({ type: 'varchar', length: 10, nullable: true })
  method?: string;

  @ApiPropertyOptional({ example: 200, description: 'HTTP status code' })
  @Column({ type: 'int', nullable: true })
  statusCode?: number;

  @ApiPropertyOptional({
    example: '{"id": 1, "name": "John"}',
    description: 'Request payload or response data',
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'Error message if failed',
    description: 'Error message if activity failed',
  })
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;
}
