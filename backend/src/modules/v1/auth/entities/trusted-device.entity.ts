import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/common/base-user/entities/user.entity';

@Entity('auth_trusted_devices')
export class TrustedDevice {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({ example: 'device-uuid-abc' })
  @Index({ unique: false })
  @Column({ type: 'varchar', length: 200 })
  deviceId: string;

  @ApiProperty({ example: 'Chrome on Windows' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceName: string | null;

  @ApiProperty({ example: '192.168.1.1' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  ipAddress: string | null;

  @ApiProperty({ example: 'Mozilla/5.0 ...' })
  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @ApiProperty({ example: '2025-01-02T00:00:00.000Z' })
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
