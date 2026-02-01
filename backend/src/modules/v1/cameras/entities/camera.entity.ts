import { Entity, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Door } from '../../locations/doors/entities/door.entity';
import { Location } from '../../locations/entities/location.entity';
import { ECameraProtocol } from '@shared/enums';

@Entity('cameras')
export class Camera extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Main Entrance Camera',
    description: 'Camera name',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiPropertyOptional({
    example: 'Main entrance camera for security monitoring',
    description: 'Camera description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    enum: ECameraProtocol,
    example: ECameraProtocol.RTSP,
    description: 'Camera streaming protocol',
  })
  @Column({
    type: 'enum',
    enum: ECameraProtocol,
    default: ECameraProtocol.RTSP,
  })
  protocol: ECameraProtocol;

  @ApiPropertyOptional({
    example: 'admin',
    description: 'Username for camera authentication',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  username?: string;

  @ApiPropertyOptional({
    example: 'password123',
    description: 'Password for camera authentication',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string;

  @ApiPropertyOptional({
    example: '192.168.1.100',
    description: 'Camera IP address',
  })
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @ApiPropertyOptional({
    example: 554,
    description: 'Camera port',
  })
  @Column({ type: 'integer', nullable: true, default: 554 })
  port?: number;

  @ApiPropertyOptional({
    example: '/stream',
    description: 'Camera stream path',
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  path?: string;

  @ApiPropertyOptional({
    example: 'rtsp://192.168.1.100:554/stream',
    description: 'Camera stream URL (generated from protocol, ip, port, and path)',
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  streamUrl?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Location ID that this camera belongs to',
  })
  @Column({ type: 'uuid', nullable: true })
  locationId?: string;

  @ApiProperty({
    type: () => Location,
    description: 'Location that this camera belongs to',
  })
  @ManyToOne(() => Location, (location) => location.cameras, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @ApiPropertyOptional({
    type: () => Door,
    description: 'Door that this camera is attached to',
  })
  @OneToOne(() => Door, (door) => door.camera, { nullable: true })
  door?: Door;

  @ApiProperty({
    example: true,
    description: 'Whether the camera stream is active',
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
