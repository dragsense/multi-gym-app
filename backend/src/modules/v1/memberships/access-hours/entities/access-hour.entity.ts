import {
  Entity,
  Column,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('access_hours')
export class AccessHour extends GeneralBaseEntity {
  @ApiProperty({ example: 'Morning Hours', description: 'Access hours name' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: 'Morning access hours from 6 AM to 12 PM',
    description: 'Access hours description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    example: '06:00',
    description: 'Start time in HH:mm format',
  })
  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  @ApiProperty({
    example: '12:00',
    description: 'End time in HH:mm format',
  })
  @Column({ type: 'varchar', length: 5 })
  endTime: string;

  @ApiProperty({
    example: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
    description: 'Days of the week when access is available',
  })
  @Column({ type: 'simple-array', nullable: true })
  daysOfWeek?: string[];

}

