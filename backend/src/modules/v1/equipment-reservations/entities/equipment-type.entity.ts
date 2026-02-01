import {
  Entity,
  Column,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Equipment } from './equipment.entity';

@Entity('equipment_types')
export class EquipmentType extends GeneralBaseEntity {
  @ApiProperty({ example: 'Treadmill', description: 'Equipment type name' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: 'Cardio equipment for running',
    description: 'Equipment type description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;


  @OneToMany(() => Equipment, (equipment) => equipment.equipmentType)
  equipment: Equipment[];
}
