import { Entity, Column, OneToMany, ManyToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Door } from '../doors/entities/door.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Membership } from '../../memberships/entities/membership.entity';
import { Checkin } from '../../checkins/entities/checkin.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';
import { Member } from '../../members/entities/member.entity';
import { Camera } from '../../cameras/entities/camera.entity';
import { DeviceReader } from '../../device-readers/entities/device-reader.entity';

@Entity('locations')
export class Location extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Main Gym',
    description: 'Location name',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: '123 Main St, City, State 12345',
    description: 'Location address',
  })
  @Column({ type: 'varchar', length: 500 })
  address: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Image file ID for the location',
  })
  @Column({ type: 'uuid', nullable: true })
  imageId?: string;

  @ApiPropertyOptional({
    description: 'File entity for the uploaded location image',
    type: () => FileUpload,
  })
  @ManyToOne(() => FileUpload, {
    cascade: true,
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'imageId' })
  image?: FileUpload | null;

  @ApiProperty({
    type: () => [Door],
    description: 'Doors associated with this location',
  })
  @OneToMany(() => Door, (door) => door.location)
  doors: Door[];

  @ApiProperty({
    type: () => [Session],
    description: 'Sessions associated with this location',
  })
  @OneToMany(() => Session, (session) => session.location)
  sessions: Session[];

  @ApiProperty({
    type: () => [Task],
    description: 'Tasks associated with this location',
  })
  @OneToMany(() => Task, (task) => task.location)
  tasks: Task[];


  @ApiProperty({
    type: () => [Checkin],
    description: 'Checkins associated with this location',
  })
  @OneToMany(() => Checkin, (checkin) => checkin.location)
  checkins: Checkin[];

  @ApiProperty({
    type: () => [Staff],
    description: 'Staff members associated with this location',
  })
  @OneToMany(() => Staff, (staff) => staff.location)
  staff: Staff[];

  @ApiProperty({
    type: () => [Camera],
    description: 'Cameras associated with this location',
  })
  @OneToMany(() => Camera, (camera) => camera.location)
  cameras: Camera[];

  @ApiProperty({
    type: () => [DeviceReader],
    description: 'Device readers associated with this location',
  })
  @OneToMany(() => DeviceReader, (deviceReader) => deviceReader.location)
  deviceReaders: DeviceReader[];
}

