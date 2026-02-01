import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities/base.entity';
import { User } from '@/common/base-user/entities/user.entity';
import {
  UnavailablePeriodDto,
  WeeklyScheduleDto,
} from '@shared/dtos/user-availability-dtos/user-availability.dto';

@Entity('user_availability')
export class UserAvailability extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID',
  })
  @Column({ type: 'varchar', unique: true })
  userId: string;

  @ApiProperty({
    description: 'Weekly schedule for the user',
    type: WeeklyScheduleDto,
  })
  @Column({ type: 'jsonb' })
  weeklySchedule: WeeklyScheduleDto;

  @Column({ type: 'jsonb', default: [] })
  unavailablePeriods: UnavailablePeriodDto[];

  // Relations
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
