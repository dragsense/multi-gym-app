import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { ETrainerServiceStatus } from '@shared/enums/trainer-service.enum';

@Entity('trainer_services')
export class TrainerService extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Personal Training',
    description: 'Service title',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    example: 'One-on-one personal training sessions',
    description: 'Service description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    enum: ETrainerServiceStatus,
    example: ETrainerServiceStatus.ACTIVE,
    description: 'Service status',
  })
  @Column({
    type: 'enum',
    enum: ETrainerServiceStatus,
    default: ETrainerServiceStatus.ACTIVE,
  })
  status: ETrainerServiceStatus;
}

