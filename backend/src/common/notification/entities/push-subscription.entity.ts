import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';

@Entity('push_subscriptions')
export class PushSubscription extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID',
  })
  @Column({ type: 'varchar' })
  userId: string;

  @ApiProperty({
    description: 'Push subscription endpoint URL',
  })
  @Column({ type: 'text' })
  endpoint: string;

  @ApiProperty({
    description: 'Push subscription keys (p256dh and auth)',
  })
  @Column({ type: 'jsonb' })
  keys: {
    p256dh: string;
    auth: string;
  };

  @ApiProperty({
    description: 'User agent of the device',
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent?: string;

  @ApiProperty({
    description: 'Device/browser identifier',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
