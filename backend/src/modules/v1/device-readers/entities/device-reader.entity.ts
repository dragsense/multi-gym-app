import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { EDeviceReaderStatus } from '@shared/enums/device-reader.enum';
import { Door } from '../../locations/doors/entities/door.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity('device_readers')
export class DeviceReader extends GeneralBaseEntity {
  @ApiPropertyOptional({
    type: () => Door,
    description: 'Door that this device reader is linked to',
  })
  @OneToOne(() => Door, (door) => door.deviceReader, { nullable: true })
  door?: Door;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Location ID that this device reader belongs to',
  })
  @Column({ type: 'uuid', nullable: true })
  locationId?: string;

  @ApiProperty({
    type: () => Location,
    description: 'Location that this device reader belongs to',
  })
  @ManyToOne(() => Location, (location) => location.deviceReaders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @ApiProperty({
    example: 'RFID Reader 001',
    description: 'Device name',
  })
  @Column({ type: 'varchar', length: 255 })
  deviceName: string;

  @ApiProperty({
    example: '00:1B:44:11:3A:B7',
    description: 'MAC address',
  })
  @Column({ type: 'varchar', length: 17, unique: true })
  macAddress: string;

  @ApiProperty({
    enum: EDeviceReaderStatus,
    example: EDeviceReaderStatus.ACTIVE,
    description: 'Device status',
  })
  @Column({
    type: 'enum',
    enum: EDeviceReaderStatus,
    default: EDeviceReaderStatus.ACTIVE,
  })
  status: EDeviceReaderStatus;
  
}

