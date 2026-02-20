import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Location } from '../../entities/location.entity';
import { Checkin } from '../../../checkins/entities/checkin.entity';
import { Membership } from '../../../memberships/entities/membership.entity';
import { DeviceReader } from '../../../device-readers/entities/device-reader.entity';
import { Camera } from '@/modules/v1/cameras/entities/camera.entity';

@Entity('doors')
export class Door extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Main Entrance',
    description: 'Door name',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: 'Main entrance door to the gym',
    description: 'Door description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Location ID that this door belongs to',
  })
  @Column({ type: 'uuid' })
  locationId: string;

  @ApiProperty({
    type: () => Location,
    description: 'Location that this door belongs to',
  })
  @ManyToOne(() => Location, (location) => location.doors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locationId' })
  location: Location;


  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Camera ID that this door is linked to',
  })
  @Column({ type: 'uuid', nullable: true })
  cameraId?: string;

  @ApiPropertyOptional({
    type: () => Camera,
    description: 'Camera that this door is linked to',
  })
  @OneToOne(() => Camera, (camera) => camera.door, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cameraId' })
  camera?: Camera;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Device Reader ID that this door is linked to',
  })
  @Column({ type: 'uuid', nullable: true })
  deviceReaderId?: string;

  @ApiPropertyOptional({
    type: () => DeviceReader,
    description: 'Device Reader that this door is linked to',
  })
  @OneToOne(() => DeviceReader, (dr) => dr.door, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deviceReaderId' })
  deviceReader?: DeviceReader;

  @ApiProperty({
    type: () => [Checkin],
    description: 'Checkins associated with this door',
  })
  @OneToMany(() => Checkin, (checkin) => checkin.door)
  checkins: Checkin[];

  @ApiProperty({
    type: () => [Membership],
    description: 'Memberships associated with this door',
  })
  @ManyToMany(() => Membership, (membership) => membership.doors)
  memberships: Membership[];
}
