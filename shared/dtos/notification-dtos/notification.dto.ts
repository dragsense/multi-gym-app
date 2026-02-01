import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  IsDateString,
  Min,
  ValidateNested,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto } from "../common/list-query.dto";
import { FieldOptions, FieldType } from "../../decorators/field.decorator";
import {
  ENotificationType,
  ENotificationPriority,
  ENotificationStatus,
} from "../../enums/notification.enum";

export class NotificationDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Notification ID",
  })
  id: string;

  @ApiProperty({
    example: "Welcome to our platform!",
    description: "Notification title",
  })
  title: string;

  @ApiProperty({
    example: "Thank you for joining us. We are excited to have you on board.",
    description: "Notification message",
  })
  message: string;

  @ApiProperty({
    enum: ENotificationType,
    example: ENotificationType.INFO,
    description: "Type of notification",
  })
  type: ENotificationType;

  @ApiProperty({
    enum: ENotificationPriority,
    example: ENotificationPriority.NORMAL,
    description: "Priority level of the notification",
  })
  priority: ENotificationPriority;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "User ID who will receive the notification",
  })
  userId?: string;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440001",
    description: "Entity ID related to the notification",
  })
  entityId?: string;

  @ApiPropertyOptional({
    example: "user",
    description: "Entity type related to the notification",
  })
  entityType?: string;

  @ApiPropertyOptional({
    example: {
      action: "user_registration",
      template: "welcome",
      timestamp: "2024-01-01T00:00:00.000Z",
    },
    description: "Additional metadata for the notification",
  })
  metadata?: {
    action?: string;
    template?: string;
    timestamp?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({
    example: false,
    description: "Whether the notification has been read",
  })
  isRead?: boolean;

  @ApiProperty({ description: "User who will receive the notification" })
  user: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Creation timestamp",
  })
  createdAt: Date;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "Last update timestamp",
  })
  updatedAt: Date;
}

export class NotificationPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: () => [NotificationDto] })
  @Type(() => NotificationDto)
  data: NotificationDto[];
}

export class NotificationListDto extends ListQueryDto {
  @ApiPropertyOptional({
    enum: ENotificationType,
    example: ENotificationType.INFO,
    description: "Filter by notification type",
  })
  @IsOptional()
  @IsEnum(ENotificationType)
  @FieldType("select", false)
  @FieldOptions(
    Object.values(ENotificationType).map((v) => ({ value: v, label: v }))
  )
  type?: ENotificationType;

  @ApiPropertyOptional({
    enum: ENotificationPriority,
    example: ENotificationPriority.NORMAL,
    description: "Filter by notification priority",
  })
  @IsOptional()
  @IsEnum(ENotificationPriority)
  @FieldType("select", false)
  @FieldOptions(
    Object.values(ENotificationPriority).map((v) => ({ value: v, label: v }))
  )
  priority?: ENotificationPriority;

  @ApiPropertyOptional({ example: false, description: "Filter by read status" })
  @IsOptional()
  @IsBoolean()
  @FieldType("select", false)
  @FieldOptions([
    { value: "true", label: "Read" },
    { value: "false", label: "Unread" },
  ])
  isRead?: boolean;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Filter by user ID",
  })
  @IsOptional()
  @IsString()
  @FieldType("text", false)
  userId?: string;

  @ApiPropertyOptional({
    example: "2024-01-01",
    description: "Filter by start date",
  })
  @IsOptional()
  @IsDateString()
  @FieldType("date", false)
  startDate?: string;

  @ApiPropertyOptional({
    example: "2024-12-31",
    description: "Filter by end date",
  })
  @IsOptional()
  @IsDateString()
  @FieldType("date", false)
  endDate?: string;
}
