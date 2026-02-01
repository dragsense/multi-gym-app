import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ENotificationType,
  ENotificationPriority,
} from '@shared/enums/notification.enum';

export class CreateNotificationDto {
  @ApiProperty({
    example: 'Welcome to our platform!',
    description: 'Notification title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Thank you for joining us. We are excited to have you on board.',
    description: 'Notification message',
  })
  @IsString()
  message: string;

  @ApiProperty({
    enum: ENotificationType,
    example: ENotificationType.INFO,
    description: 'Type of notification',
  })
  @IsEnum(ENotificationType)
  type: ENotificationType;

  @ApiPropertyOptional({
    enum: ENotificationPriority,
    example: ENotificationPriority.NORMAL,
    description: 'Priority level of the notification',
  })
  @IsOptional()
  @IsEnum(ENotificationPriority)
  priority?: ENotificationPriority;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Entity ID related to the notification',
  })
  @IsOptional()
  @IsNumber()
  entityId?: string;

  @ApiPropertyOptional({
    example: 'user',
    description: 'Entity type related to the notification',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    example: {
      action: 'user_registration',
      template: 'welcome',
      timestamp: '2024-01-01T00:00:00.000Z',
    },
    description: 'Additional metadata for the notification',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the notification has been read',
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    example: 'Welcome to our platform!',
    description: 'Email subject line',
  })
  @IsOptional()
  @IsString()
  emailSubject?: string;

  @ApiPropertyOptional({
    example:
      '<html><body><h1>Welcome!</h1><p>Thank you for joining us.</p></body></html>',
    description: 'HTML content for email notification',
  })
  @IsOptional()
  @IsString()
  htmlContent?: string;
}
