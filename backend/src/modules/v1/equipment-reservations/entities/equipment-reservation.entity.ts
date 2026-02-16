import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Equipment } from './equipment.entity';

@Entity('equipment_reservations')
@Index(['equipmentId', 'startDateTime', 'endDateTime'])
export class EquipmentReservation extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Equipment ID',
  })
  @Column({ type: 'uuid' })
  equipmentId: string;

  @ApiProperty({
    example: '2026-01-25T10:00:00.000Z',
    description: 'Reservation start date and time',
  })
  @Column({ type: 'timestamptz' })
  startDateTime: Date;

  @ApiProperty({
    example: '2026-01-25T11:00:00.000Z',
    description: 'Reservation end date and time',
  })
  @Column({ type: 'timestamptz' })
  endDateTime: Date;

  @ApiPropertyOptional({
    example: 'Training session',
    description: 'Reservation notes or purpose',
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => Equipment, { eager: true })
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;
}
