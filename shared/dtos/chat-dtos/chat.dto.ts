import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
  IsObject,
  ValidateNested,
  IsEnum,
  IsInt,
  ValidateIf,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type, Expose } from "class-transformer";
import { FieldType, FieldOptions } from "../../decorators/field.decorator";
import { PaginationMetaDto } from "../common/pagination.dto";
import { ListQueryDto, SingleQueryDto } from "../common/list-query.dto";
import { PartialType } from "../../lib/dto-type-adapter";
import { UserDto } from "../user-dtos/user.dto";
import { EUserLevels } from "../../enums/user.enum";
import { FileUploadDto } from "../file-upload-dtos/file-upload.dto";

export class SendMessageDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ID of the chat",
  })
  @IsUUID()
  @IsNotEmpty()
  @FieldType("text", true)
  chatId: string;

  @ApiProperty({
    example: "Hello, how are you?",
    description: "Message content",
  })
  @IsString()
  @IsNotEmpty()
  @FieldType("textarea", true)
  message: string;

  @ApiPropertyOptional({
    type: "string",
    format: "binary",
    description: "File attachment (sent via FormData)",
  })
  @IsOptional()
  file?: any;
}

export class CreateChatDto {
  @ApiPropertyOptional({
    example: "My Group Chat",
    description: "Name of the chat (required for group chats)",
  })
  @IsString()
  @FieldType("text")
  @ValidateIf((object, value) => object.isGroup)
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    example: true,
    description: "Whether this is a group chat",
  })
  @IsNotEmpty()
  @IsBoolean()
  @FieldType("switch")
  isGroup: boolean;

  @ApiProperty({
    example: ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
    description: "Participant IDs",
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Expose()
  @Type(() => UserDto)
  @FieldType("custom", true)
  participantIds: UserDto[] | UserDto;
}

export class UpdateChatDto {
  @ApiPropertyOptional({
    example: "My Group Chat",
    description: "Name of the chat (for group chats)",
  })
  @IsOptional()
  @IsString()
  @FieldType("text")
  name?: string;
}

export class ChatMessageDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Message ID",
  })
  id: string;

  @ApiProperty({
    example: "Hello, how are you?",
    description: "Message content",
  })
  message: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440001",
    description: "ID of the sender",
  })
  senderId: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440002",
    description: "ID of the chat",
  })
  chatId: string;

  @ApiPropertyOptional({
    example: false,
    description: "Whether the message has been read",
  })
  isRead?: boolean;

  @ApiPropertyOptional({
    example: "2024-01-01T00:00:00.000Z",
    description: "When the message was read",
  })
  readAt?: string;

  @ApiPropertyOptional({
    example: "text",
    description: "Message type (text, image, file, etc.)",
  })
  messageType?: string;

  @ApiPropertyOptional({
    description: "Additional metadata for the message",
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    example: false,
    description: "Whether the message is deleted",
  })
  isDeleted?: boolean;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ID of the user who deleted the message",
  })
  deletedBy?: string;

  @ApiPropertyOptional({
    example: "everyone",
    description: "Who can see the deletion (everyone or self)",
  })
  deletedFor?: string;

  @ApiPropertyOptional({
    description: "File attachment (FileUpload relation)",
    type: () => FileUploadDto,
  })
  attachment?: FileUploadDto;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "When the message was created",
  })
  createdAt: string;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "When the message was updated",
  })
  updatedAt: string;

  @ApiPropertyOptional({
    type: () => UserDto,
    description: "User who sent the message",
  })
  sender?: UserDto;
}

export class ChatUserDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "ChatUser ID",
  })
  id: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440001",
    description: "ID of the chat",
  })
  chatId: string;

  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440002",
    description: "ID of the user",
  })
  userId: string;

  @ApiPropertyOptional({
    example: false,
    description: "Whether the user has archived the chat",
  })
  archived?: boolean;


  @ApiPropertyOptional({
    example: false,
    description: "Whether the user is an admin of the chat",
  })
  isAdmin?: boolean;

  @ApiPropertyOptional({
    example: "2024-01-01T00:00:00.000Z",
    description: "When the user joined the chat",
  })
  joinedAt?: string;

  @ApiPropertyOptional({
    example: "2024-01-01T00:00:00.000Z",
    description: "When the user deleted the chat",
  })
  deletedAt?: string;

  @ApiPropertyOptional({
    example: "2024-01-01T00:00:00.000Z",
    description: "When the user last seen/visited the chat",
  })
  lastSeenAt?: string;

  @ApiPropertyOptional({
    example: "2024-01-01T00:00:00.000Z",
    description: "When the user cleared the chat",
  })
  clearedAt?: string;

  @ApiPropertyOptional({
    example: 5,
    description: "Number of unread messages in this chat for this user",
  })
  unreadCount?: number;

  @ApiPropertyOptional({
    type: () => UserDto,
    description: "User in this chat",
  })
  user?: UserDto;
}

export class ChatDto {
  @ApiProperty({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Chat ID",
  })
  id: string;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440003",
    description: "ID of the last message",
  })
  lastMessageId?: string;

  @ApiPropertyOptional({
    example: "My Chat Group",
    description: "Name of the chat (for group chats)",
  })
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether this is a group chat",
  })
  isGroup?: boolean;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "When the chat was created",
  })
  createdAt: string;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    description: "When the chat was updated",
  })
  updatedAt: string;

  @ApiPropertyOptional({
    type: () => ChatMessageDto,
    description: "Last message sent in the chat",
  })
  lastMessage?: ChatMessageDto;

  @ApiPropertyOptional({
    example: 5,
    description: "Number of unread messages in the chat",
  })
  unreadCount?: number;

  @ApiPropertyOptional({
    type: () => [ChatMessageDto],
    description: "Messages in this chat",
  })
  messages?: ChatMessageDto[];


  @ApiPropertyOptional({
    example: false,
    description: "Whether the current user is an admin of this chat",
  })
  isAdmin?: boolean;

  @ApiPropertyOptional({
    example: 2,
    description: "Number of participants in the chat",
  })
  participantCount?: number;

  @ApiPropertyOptional({
    description: "Other user info (for 1-on-1 chats)",
  })
  chatUsers?: ChatUserDto[];
}

export class ChatListDto extends ListQueryDto<ChatDto> {
  @ApiPropertyOptional({
    enum: EUserLevels,
    example: EUserLevels.STAFF,
    description: "Filter chats by user role level",
  })
  @IsOptional()
  @IsEnum(EUserLevels)
  @Expose()
  @Type(() => Number)
  @IsInt()
  @FieldType("select", false)
  @FieldOptions([
    { value: String(EUserLevels.STAFF), label: EUserLevels[EUserLevels.STAFF] },
    { value: String(EUserLevels.MEMBER), label: EUserLevels[EUserLevels.MEMBER] },
  ])
  level?: EUserLevels;

}

export class ChatSingleDto extends SingleQueryDto<ChatDto> {}

export class ChatMessageListDto extends ListQueryDto<ChatMessageDto> {}

export class ChatPaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: [ChatDto] })
  data: ChatDto[];
}

export class ChatMessagePaginatedDto extends PaginationMetaDto {
  @ApiProperty({ type: [ChatMessageDto] })
  data: ChatMessageDto[];
}
