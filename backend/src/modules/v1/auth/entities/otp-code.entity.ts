import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { User } from '@/common/base-user/entities/user.entity';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('auth_otp_codes')
export class OtpCode extends GeneralBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({ example: '123456' })
  @Column({ type: 'varchar', length: 10 })
  code: string;

  @ApiProperty({ example: 'login' })
  @Column({ type: 'varchar', length: 30 })
  purpose: string; // e.g., 'login'

  @ApiProperty({ example: 'device-uuid-abc' })
  @Index()
  @Column({ type: 'varchar', length: 200, nullable: true })
  deviceId: string | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  isUsed: boolean;
}
