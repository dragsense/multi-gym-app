import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { EquipmentType } from './equipment-type.entity';
import { EquipmentReservation } from './equipment-reservation.entity';
import { Location } from '../../locations/entities/location.entity';
import { EEquipmentStatus } from '@shared/enums';

@Entity('equipment')
export class Equipment extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Equipment type ID',
  })
  @Column({ type: 'uuid' })
  equipmentTypeId: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Location ID that this equipment belongs to',
  })
  @Column({ type: 'uuid', nullable: true })
  locationId?: string;

  @ApiPropertyOptional({
    type: () => Location,
    description: 'Location that this equipment belongs to',
  })
  @ManyToOne(() => Location, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'locationId' })
  location?: Location;

  @ApiProperty({ example: 'Treadmill #1', description: 'Equipment name/identifier' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiPropertyOptional({
    example: 'Main floor, near entrance',
    description: 'Equipment location or description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({
    example: 'EQ-001',
    description: 'Equipment serial number or code',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber?: string;

  @ApiPropertyOptional({
    example: EEquipmentStatus.AVAILABLE,
    description: 'Equipment status',
    enum: EEquipmentStatus,
    default: EEquipmentStatus.AVAILABLE,
  })
  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: EEquipmentStatus.AVAILABLE,
    enum: EEquipmentStatus,
  })
  status: EEquipmentStatus;

  // Relations
  @ManyToOne(() => EquipmentType, (type) => type.equipment, { eager: true })
  @JoinColumn({ name: 'equipmentTypeId' })
  equipmentType: EquipmentType;

  @OneToMany(() => EquipmentReservation, (reservation) => reservation.equipment)
  reservations: EquipmentReservation[];
}
