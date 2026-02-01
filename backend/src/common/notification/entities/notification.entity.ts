import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import {
  ENotificationType,
  ENotificationPriority,
} from '@shared/enums/notification.enum';

@Entity('notifications')
export class Notification extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Welcome to our platform!',
    description: 'Notification title',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    example: 'Thank you for joining us. We are excited to have you on board.',
    description: 'Notification message',
  })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    enum: ENotificationType,
    example: ENotificationType.INFO,
    description: 'Type of notification',
  })
  @Column({
    type: 'enum',
    enum: ENotificationType,
    default: ENotificationType.INFO,
  })
  type: ENotificationType;

  @ApiProperty({
    enum: ENotificationPriority,
    example: ENotificationPriority.NORMAL,
    description: 'Priority level of the notification',
  })
  @Column({
    type: 'enum',
    enum: ENotificationPriority,
    default: ENotificationPriority.NORMAL,
  })
  priority: ENotificationPriority;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Entity ID related to the notification',
  })
  @Column({ type: 'varchar', nullable: true })
  entityId?: string;

  @ApiPropertyOptional({
    example: 'user',
    description: 'Entity type related to the notification',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  entityType?: string;

  @ApiPropertyOptional({
    example: '{"action": "user_registration", "template": "welcome"}',
    description: 'Additional metadata for the notification',
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the notification has been read',
  })
  @Column({ type: 'boolean', default: false })
  isRead?: boolean;

  @ApiPropertyOptional({
    example: 'Welcome to our platform!',
    description: 'Email subject line',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  emailSubject?: string;

  @ApiPropertyOptional({
    example:
      '<html><body><h1>Welcome!</h1><p>Thank you for joining us.</p></body></html>',
    description: 'HTML content for email notification',
  })
  @Column({ type: 'text', nullable: true })
  htmlContent?: string;
}
