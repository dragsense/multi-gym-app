import { Controller, Get, Post, Body, Param, Query, Delete, Patch, UseInterceptors, UploadedFile, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { SendMessageDto, CreateChatDto, ChatListDto, ChatMessageListDto, ChatPaginatedDto, ChatMessagePaginatedDto, UpdateChatDto } from '@shared/dtos/chat-dtos/chat.dto';
import { ChatMessageDto, ChatDto } from '@shared/dtos/chat-dtos/chat.dto';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { ChatWebSocketService } from './services/chat-websocket.service';
import { RequireModule } from '@/decorators/require-module.decorator';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@RequireModule(ESubscriptionFeatures.CHAT)
@MinUserLevel(EUserLevels.MEMBER)
@Resource(EResource.CHAT)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatWebSocketService: ChatWebSocketService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create or get existing chat with a user or group' })
  @ApiResponse({
    status: 201,
    description: 'Chat created or retrieved successfully',
    type: ChatDto,
  })
  async createOrGetChat(
    @AuthUser() currentUser: User,
    @Body() dto: CreateChatDto,
  ) {
    const result = await this.chatService.createOrGetChat(currentUser.id, dto);
    const chat = result.chat;
    // Emit new chat event to all participants (only if it's a new chat, not restored)
    if (chat?.id) {
      const participants = await this.chatService.getChatParticipants(chat.id, currentUser.id);
      for (const participant of participants) {
        const participantUserId = (participant as any).userId || (participant as any).user?.id;
        if (participantUserId && participantUserId !== currentUser.id) {
          this.chatWebSocketService.emitToUserRoom(
            `user_${participantUserId}`,
            'newChat',
            chat as unknown as ChatDto,
          );
        }
      }
    }

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get all chats for the current user with filters' })
  @ApiResponse({
    status: 200,
    description: 'Chats retrieved successfully',
    type: ChatPaginatedDto,
  })
  async getMyChats(
    @AuthUser() currentUser: User,
    @Query() query: ChatListDto,
  ) {
    return this.chatService.getUserChats(currentUser.id, query);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get messages for a chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: ChatMessagePaginatedDto,
  })
  async getChatMessages(
    @AuthUser() currentUser: User,
    @Param('chatId') chatId: string,
    @Query() query: ChatMessageListDto,
  ) {
    return this.chatService.getChatMessages(chatId, currentUser.id, query);
  }

  @Post('messages')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: ChatMessageDto,
  })
  async sendMessage(
    @AuthUser() currentUser: User,
    @Body() dto: SendMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ChatMessageDto> {
    const message = await this.chatService.sendMessage(
      currentUser.id,
      dto.chatId,
      dto.message,
      file,
    );

    const sender = message.sender as any;
    const attachment = message.attachment as any;
    const messageData = {
      id: message.id,
      senderId: message.senderId,
      message: message.message,
      chatId: message.chatId,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      messageType: message.messageType,
      attachment: attachment
        ? {
          id: attachment.id,
          url: attachment.url,
          name: attachment.name,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          type: attachment.type,
          size: attachment.size,
        }
        : undefined,
      sender: sender
        ? {
          id: sender.id,
          firstName: sender.firstName,
          lastName: sender.lastName,
        }
        : undefined,
    };

    // Emit to chat room for all participants
    this.chatWebSocketService.emitToChatRoom(
      message.chatId,
      'newMessage',
      messageData,
    );

    if (message.chatId) {
      this.chatService.getChat(message.chatId).then(async (chat) => {
        if (chat) {
          const participants = await this.chatService.getChatParticipants(message.chatId, currentUser.id);
          for (const participant of participants) {
            const participantUserId = (participant as any).userId || (participant as any).user?.id;
            if (participantUserId && participantUserId !== currentUser.id && !chat.isGroup) {
              this.chatWebSocketService.emitToUserRoom(
                `user_${participantUserId}`,
                'newChat',
                chat as unknown as ChatDto,
              );
            }

            if (participantUserId && participantUserId !== currentUser.id) {
              this.chatWebSocketService.emitToUserRoom(
                `user_${participantUserId}`,
                'newUnreadCount',
                {
                  chatId: chat.id,
                  unreadCount: (participant as any).unreadCount,
                  lastMessage: chat.lastMessage,
                },
              );
            }
          }
        }
      }).catch(() => null);
    }

    return message as unknown as ChatMessageDto;
  }

  @Patch('read/:chatId')
  @ApiOperation({ summary: 'Reset unread count to 0 for a chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Unread count reset successfully' })
  async resetUnreadCount(
    @AuthUser() currentUser: User,
    @Param('chatId') chatId: string,
  ): Promise<{ success: boolean }> {
    await this.chatService.resetUnreadCount(chatId, currentUser.id);
    return { success: true };
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiQuery({ name: 'deleteFor', required: false, enum: ['everyone', 'self'], description: 'Delete for everyone or self' })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
  })
  async deleteMessage(
    @AuthUser() currentUser: User,
    @Param('messageId') messageId: string,
    @Query('deleteFor') deleteFor: 'everyone' | 'self' = 'self',
  ): Promise<{ success: boolean }> {
    await this.chatService.deleteMessage(messageId, currentUser.id, deleteFor);
    return { success: true };
  }

  @Delete('clear/:chatId')
  @ApiOperation({ summary: 'Clear all messages in a chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat cleared successfully',
  })
  async clearChat(
    @AuthUser() currentUser: User,
    @Param('chatId') chatId: string,
  ): Promise<{ success: boolean }> {
    await this.chatService.clearChat(chatId, currentUser.id);
    return { success: true };
  }

  @Patch(':chatId')
  @ApiOperation({ summary: 'Update a chat (name only for group chats)' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat updated successfully',
    type: ChatDto,
  })
  async updateChat(
    @AuthUser() currentUser: User,
    @Param('chatId') chatId: string,
    @Body() dto: UpdateChatDto,
  ): Promise<ChatDto> {
    const chat = await this.chatService.updateChat(chatId, currentUser.id, dto);
    return chat as unknown as ChatDto;
  }

  @Get(':chatId/users')
  @ApiOperation({ summary: 'Get all participants in a chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat participants retrieved successfully',
  })
  async getChatParticipants(
    @AuthUser() currentUser: User,
    @Param('chatId') chatId: string,
  ) {
    return this.chatService.getChatParticipants(chatId, currentUser.id);
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Get a single chat by ID' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat retrieved successfully',
    type: ChatDto,
  })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async getChat(
    @AuthUser() currentUser: User,
    @Param('chatId') chatId: string,
  ): Promise<ChatDto> {
    const chat = await this.chatService.getChat(chatId);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    return chat as unknown as ChatDto;
  }



  @Post(':chatId/users')
  @ApiOperation({ summary: 'Add users to a chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Users added to chat successfully',
    type: ChatDto,
  })
  async addUsersToChat(
    @AuthUser() currentUser: User,
    @Param('chatId') chatId: string,
    @Body() body: { participantIds: string[] },
  ) {
    // Extract user IDs from UserDto objects if they are objects, otherwise use as strings
    const userIds = body.participantIds.map((participant: any) =>
      typeof participant === 'string' ? participant : participant.id
    );

    const { message, chat } = await this.chatService.addUsersToChat(chatId, userIds, currentUser.id);

    if (message) {
      this.chatWebSocketService.emitToChatRoom(
        chat.id,
        'newMessage',
        message as unknown as ChatMessageDto,
      );
    }

    if (chat) {
      this.chatService.getChat(chat.id).then(async (chat) => {
        if (chat) {
          const participants = await this.chatService.getChatParticipants(chat.id, currentUser.id);
          for (const participant of participants) {
            const participantUserId = (participant as any).userId || (participant as any).user?.id;
            if (participantUserId && participantUserId !== currentUser.id) {
              this.chatWebSocketService.emitToUserRoom(
                `user_${participantUserId}`,
                'newUnreadCount',
                {
                  chatId: chat.id,
                  unreadCount: (participant as any).unreadCount + 1,
                  lastMessage: chat.lastMessage,
                },
              );
            }
          }
        }
      }).catch(() => null);
    }

    return { success: true };
  }

  @Delete(':chatId/users/:userId')
  @ApiOperation({ summary: 'Remove user from chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({
    status: 200,
    description: 'User removed from chat successfully',
  })
  async removeUserFromChat(
    @AuthUser() currentUser: User,
    @Param('chatId') chatId: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    const { message, chat } = await this.chatService.removeUserFromChat(chatId, userId, currentUser.id);


    if (message) {
      this.chatWebSocketService.emitToChatRoom(
        chat.id,
        'newMessage',
        message as unknown as ChatMessageDto,
      );
    }

    if (chat) {
      this.chatService.getChat(chat.id).then(async (chat) => {
        if (chat) {
          const participants = await this.chatService.getChatParticipants(chat.id, currentUser.id);
          for (const participant of participants) {
            const participantUserId = (participant as any).userId || (participant as any).user?.id;
            if (participantUserId && participantUserId !== currentUser.id) {
              this.chatWebSocketService.emitToUserRoom(
                `user_${participantUserId}`,
                'newUnreadCount',
                {
                  chatId: chat.id,
                  unreadCount: (participant as any).unreadCount + 1,
                  lastMessage: chat.lastMessage,
                },
              );
            }
          }
        }
      }).catch(() => null);
    }

    return { message: 'User removed from chat successfully' };
  }

  @Patch(':chatId/users/:userId/admin')
  @ApiOperation({ summary: 'Make user admin of a chat' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiParam({ name: 'userId', description: 'User ID to make admin' })
  @ApiResponse({
    status: 200,
    description: 'User made admin successfully',
  })
  async makeUserAdmin(
    @AuthUser() currentUser: User,
    @Param('chatId') chatId: string,
    @Param('userId') userId: string,
  ) {
    await this.chatService.makeUserAdmin(chatId, userId, currentUser.id);

    return { success: true };
  }



  @Delete(':chatId')
  @ApiOperation({ summary: 'Delete a chat for the current user' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat deleted successfully',
  })
  async deleteChat(
    @AuthUser() currentUser: User,
    @Param('chatId') chatId: string,
  ): Promise<{ success: boolean }> {
    const { message, chat } = await this.chatService.deleteChat(chatId, currentUser.id);

    if (message) {
      this.chatWebSocketService.emitToChatRoom(
        chat.id,
        'newMessage',
        message as unknown as ChatMessageDto,
      );
    }

    if (chat) {
      this.chatService.getChat(chat.id).then(async (chat) => {
        if (chat) {
          const participants = await this.chatService.getChatParticipants(chat.id, currentUser.id);
          for (const participant of participants) {
            const participantUserId = (participant as any).userId || (participant as any).user?.id;
            if (participantUserId && participantUserId !== currentUser.id) {
              this.chatWebSocketService.emitToUserRoom(
                `user_${participantUserId}`,
                'newUnreadCount',
                {
                  chatId: chat.id,
                  unreadCount: (participant as any).unreadCount + 1,
                  lastMessage: chat.lastMessage,
                },
              );
            }
          }
        }
      }).catch(() => null);
    }


    return { success: true };
  }
}
