import { IsString, IsObject, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PushSubscriptionKeysDto {
  @ApiProperty({
    description: "P256DH key for push subscription",
    example: "BPM...=",
  })
  @IsString()
  p256dh: string;

  @ApiProperty({
    description: "Auth key for push subscription",
    example: "...",
  })
  @IsString()
  auth: string;
}

export class CreatePushSubscriptionDto {
  @ApiProperty({
    description: "Push subscription endpoint URL",
    example: "https://fcm.googleapis.com/fcm/send/...",
  })
  @IsString()
  endpoint: string;

  @ApiProperty({
    description: "Push subscription keys",
    type: PushSubscriptionKeysDto,
  })
  @IsObject()
  keys: PushSubscriptionKeysDto;

  @ApiPropertyOptional({
    description: "User agent of the device",
    example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({
    description: "Device/browser identifier",
    example: "my-unique-device-id",
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

export class PushSubscriptionDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Subscription ID",
  })
  id: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "User ID",
  })
  userId: string;

  @ApiProperty({
    description: "Push subscription endpoint URL",
  })
  endpoint: string;

  @ApiProperty({
    description: "Push subscription keys",
    type: PushSubscriptionKeysDto,
  })
  keys: PushSubscriptionKeysDto;

  @ApiPropertyOptional({
    description: "User agent of the device",
  })
  userAgent?: string;

  @ApiPropertyOptional({
    description: "Device/browser identifier",
  })
  deviceId?: string;

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

export class PushSubscriptionResponseDto {
  @ApiProperty({
    description: "Response message",
  })
  message: string;

  @ApiProperty({
    description: "Push subscription data",
    type: PushSubscriptionDto,
  })
  subscription: PushSubscriptionDto;
}

export class PushSubscriptionsListDto {
  @ApiProperty({
    description: "List of push subscriptions",
    type: [PushSubscriptionDto],
  })
  subscriptions: PushSubscriptionDto[];

  @ApiProperty({
    description: "Total count of subscriptions",
  })
  count: number;
}

export class UnsubscribePushResponseDto {
  @ApiProperty({
    description: "Response message",
  })
  message: string;

  @ApiProperty({
    description: "Whether the subscription was removed",
  })
  removed: boolean;
}
