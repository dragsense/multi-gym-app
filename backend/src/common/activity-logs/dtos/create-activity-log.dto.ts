import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  EActivityType,
  EActivityStatus,
} from '@shared/enums/activity-log.enum';

export class CreateActivityLogDto {
  @ApiProperty({
    example: 'User logged in successfully',
    description: 'Activity description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    enum: EActivityType,
    example: EActivityType.LOGIN,
    description: 'Type of activity performed',
  })
  @IsOptional()
  @IsEnum(EActivityType)
  type?: EActivityType;

  @ApiPropertyOptional({
    enum: EActivityStatus,
    example: EActivityStatus.SUCCESS,
    description: 'Status of the activity',
  })
  @IsOptional()
  @IsEnum(EActivityStatus)
  status?: EActivityStatus;

  @ApiPropertyOptional({
    example: '192.168.1.1',
    description: 'IP address of the user',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    example: 'Mozilla/5.0...',
    description: 'User agent string',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    example: '/api/v1/users',
    description: 'API endpoint accessed',
  })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ example: 'POST', description: 'HTTP method used' })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ example: 200, description: 'HTTP status code' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  statusCode?: number;

  @ApiPropertyOptional({
    example: '{"id": 1, "name": "John"}',
    description: 'Request payload or response data',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'Error message if failed',
    description: 'Error message if activity failed',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User who performed the activity',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
