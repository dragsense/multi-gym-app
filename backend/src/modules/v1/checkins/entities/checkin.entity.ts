import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { Door } from '../../locations/doors/entities/door.entity';
import { Location } from '../../locations/entities/location.entity';
import { CheckinSnapshot } from './checkin-snapshot.entity';

@Entity('checkins')
export class Checkin extends GeneralBaseEntity {

  @ApiProperty({ type: () => User, description: 'UserID who checked in' })
  @ManyToOne(() => User, { eager: true })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ type: () => User, description: 'User who checked in' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Location ID where check-in occurred',
  })
  @Column({ type: 'uuid', nullable: true })
  locationId?: string;

  @ApiPropertyOptional({
    type: () => Location,
    description: 'Location where check-in occurred',
  })
  @ManyToOne(() => Location, (location) => location.checkins, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locationId' })
  location?: Location;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Door ID where check-in occurred',
  })
  @Column({ type: 'uuid', nullable: true })
  doorId?: string;

  @ApiPropertyOptional({
    type: () => Door,
    description: 'Door where check-in occurred',
  })
  @ManyToOne(() => Door, (door) => door.checkins, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doorId' })
  door?: Door;

  @ApiProperty({
    example: '2024-01-15T08:30:00.000Z',
    description: 'Check-in timestamp',
  })
  @Column({ type: 'timestamptz' })
  checkInTime: Date;

  @ApiPropertyOptional({
    example: '2024-01-15T10:45:00.000Z',
    description: 'Check-out timestamp',
  })
  @Column({ type: 'timestamptz', nullable: true })
  checkOutTime?: Date;

  @ApiPropertyOptional({
    example: 'Main Entrance - RFID Scanner',
    description: 'Location or device where check-in occurred (text field)',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  locationText?: string;

  @ApiPropertyOptional({
    example: 'RFID-12345',
    description: 'Device ID used for check-in',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceId?: string;

  @ApiPropertyOptional({
    example: 'America/New_York',
    description: 'Timezone for the check-in',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  timezone?: string;

  @ApiPropertyOptional({
    example: 'Notes about the check-in',
    description: 'Additional notes or comments',
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Snapshots captured during check-in',
    type: () => [CheckinSnapshot],
  })
  @OneToMany(() => CheckinSnapshot, (snapshot) => snapshot.checkin, {
    cascade: true,
    eager: false,
  })
  snapshots?: CheckinSnapshot[];
}

