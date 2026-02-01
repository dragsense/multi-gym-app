import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Chat } from '@/common/base-chat/entities/chat.entity';
import { ChatMessage } from '@/common/base-chat/entities/chat-message.entity';
import { CreateChatDto, ChatListDto, ChatMessageListDto, UpdateChatDto, ChatUserDto } from '@shared/dtos/chat-dtos/chat.dto';
import { BaseChatService } from '@/common/base-chat/base-chat.service';
import { BaseChatMessageService } from '@/common/base-chat/base-chat-message.service';
import { BaseChatUserService } from '@/common/base-chat/base-chat-user.service';
import { BaseChatUserMessageService } from '@/common/base-chat/base-chat-user-message.service';
import { ChatNotificationService } from './services/chat-notification.service';
import { User } from '@/common/base-user/entities/user.entity';
import { UserDto } from '@shared/dtos/user-dtos/user.dto';
import { ChatUser } from '@/common/base-chat/entities/chat-user.entity';
import { IMessageResponse } from '@shared/interfaces';
import { BaseUsersService } from '@/common/base-user/base-users.service';
import { FileUploadService } from '@/common/file-upload/file-upload.service';
import { EFileType } from '@shared/enums';
import { Brackets } from 'typeorm';

@Injectable()
export class ChatService {
  private readonly MAX_GROUP_SIZE = 100;

  constructor(
    private readonly baseChatService: BaseChatService,
    private readonly baseChatMessageService: BaseChatMessageService,
    private readonly baseChatUserService: BaseChatUserService,
    private readonly baseChatUserMessageService: BaseChatUserMessageService,
    private readonly chatNotificationService: ChatNotificationService,
    private readonly baseUsersService: BaseUsersService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  /**
   * Create or get existing chat between users
   */
  async createOrGetChat(userId: string, dto: CreateChatDto): Promise<IMessageResponse & { chat: Chat }> {
    // Validate: if isGroup is true, name is required
    if (dto.isGroup && (!dto.name || dto.name.trim().length === 0)) {
      throw new ForbiddenException('Group chat name is required');
    }

    const participantIds = Array.isArray(dto.participantIds) ? dto.participantIds : [dto.participantIds];

    // Extract user IDs from UserDto objects
    const participantUserIds = participantIds.map(
      (participant: UserDto) => participant.id,
    );

    const allParticipantIds = [
      userId,
      ...participantUserIds,
    ];
    const uniqueParticipantIds = [...new Set(allParticipantIds)].sort();

    // For single chats (isGroup = false), only allow 2 participants
    if (!dto.isGroup && uniqueParticipantIds.length !== 2) {
      throw new ForbiddenException('Single chat must have exactly 2 participants');
    }

    // For group chats, maximum 100 participants
    if (dto.isGroup && uniqueParticipantIds.length > this.MAX_GROUP_SIZE) {
      throw new ForbiddenException(`Group chat can have a maximum of ${this.MAX_GROUP_SIZE} participants`);
    }

    if (!dto.isGroup) {

      // Direct SQL query to find existing chat with exact same participants
      // Find all chatUser records where the chat is not a group and the chat has exactly the same participant user ids (no more, no less)
      const existingChats = await this.baseChatService.chatRepository
        .createQueryBuilder('chat')
        .leftJoin('chat.chatUsers', 'chatUsers')
        .where('chat.isGroup = :isGroup', { isGroup: false })
        .andWhere('chatUsers.userId IN (:...participantIds)', { participantIds: uniqueParticipantIds })
        .groupBy('chat.id')
        .having('COUNT(chatUsers.userId) = :participantCount', { participantCount: uniqueParticipantIds.length })
        .select('chat.id', 'id')
        .getRawMany();


      if (existingChats.length > 0) {
        const existingChatId = existingChats[0].id;
        const existingChatUsers = await this.getChatParticipants(existingChatId, userId, true);
        // Chat exists - restore it by moving deletedAt to clearedAt
        for (const existingChatUser of existingChatUsers) {
          const restoredChatUser = await this.baseChatUserService.update(existingChatUser.id, {
            deletedAt: null,
            clearedAt: existingChatUser.deletedAt ? new Date(existingChatUser.deletedAt) : undefined,
          } as any, undefined, true);
        }

        const chat = await this.baseChatService.getSingle(existingChatId, {
          _relations: ['chatUsers', 'chatUsers.user', 'lastMessage'],
          _select: ['chatUsers.id', 'chatUsers.isAdmin', 'chatUsers.joinedAt', 'chatUsers.user.id', 'chatUsers.user.firstName', 'chatUsers.user.lastName', 'chatUsers.user.email'],
        });

        return { message: 'Chat already exists', chat: chat as Chat };
      }
    }

    // Create new chat
    const chat = await this.baseChatService.create({
      name: dto.isGroup ? dto.name?.trim() : undefined,
      isGroup: dto.isGroup,
    }, {
      afterCreate: async (savedEntity, manager) => {
        const chatUsers = uniqueParticipantIds.map((participantId: string) =>
          manager.create(ChatUser, {
            chatId: savedEntity.id,
            userId: participantId,
            joinedAt: new Date(),
            // Set the creator as admin (only for group chats)
            isAdmin: dto.isGroup ? participantId === userId : false,
          }),
        );
        await manager.save(ChatUser, chatUsers);

        // Create system message for chat creation
        // Use manager repository inside transaction for consistency
        const userRepository = manager.getRepository(User);
        const creator = await userRepository.findOne({ where: { id: userId } });
        const otherUser = uniqueParticipantIds.find((id) => id !== userId);
        const otherUserData = otherUser ? await userRepository.findOne({ where: { id: otherUser } }) : null;

        let systemMessageText: string;
        let systemMessageMetadata: Record<string, any>;

        if (dto.isGroup) {
          // Group chat system message
          systemMessageText = `${creator?.firstName || 'Someone'} created group "${dto.name}"`;
          systemMessageMetadata = {
            type: 'groupCreated',
            createdBy: userId,
            createdByName: `${creator?.firstName || ''} ${creator?.lastName || ''}`.trim() || creator?.email,
            groupName: dto.name,
          };
        } else {
          // Single chat system message
          const otherUserName = otherUserData
            ? `${otherUserData.firstName || ''} ${otherUserData.lastName || ''}`.trim() || otherUserData.email
            : 'User';
          systemMessageText = `${creator?.firstName || 'Someone'} initiated chat with ${otherUserName}`;
          systemMessageMetadata = {
            type: 'chatInitiated',
            initiatedBy: userId,
            initiatedByName: `${creator?.firstName || ''} ${creator?.lastName || ''}`.trim() || creator?.email,
            otherUserId: otherUser,
            otherUserName: otherUserName,
          };
        }

        const systemMessage = manager.create(ChatMessage, {
          chatId: savedEntity.id,
          senderId: userId,
          message: systemMessageText,
          messageType: 'system',
          metadata: systemMessageMetadata,
        });
        await manager.save(ChatMessage, systemMessage);

        return chatUsers;
      }
    });

    // Update last message (for both group and single chats)
    const lastSystemMessage = await this.baseChatMessageService.chatMessageRepository
      .createQueryBuilder('msg')
      .where('msg.chatId = :chatId', { chatId: chat.id })
      .orderBy('msg.createdAt', 'DESC')
      .getOne();

    if (lastSystemMessage) {
      await this.baseChatService.update(chat.id, {
        lastMessageId: lastSystemMessage.id,
      } as any);
    }

    const savedChat = await this.baseChatService.getSingle(chat.id, {
      _relations: ['chatUsers', 'chatUsers.user', 'lastMessage'],
      _select: ['chatUsers.id', 'chatUsers.isAdmin', 'chatUsers.joinedAt', 'chatUsers.user.id', 'chatUsers.user.firstName', 'chatUsers.user.lastName', 'chatUsers.user.email'],
    });

    return { message: 'Chat created successfully', chat: savedChat as Chat };
  }

  /**
   * Get all participants in a chat
   */
  async getChatParticipants(
    chatId: string,
    userId: string,
    deleted?: boolean,
  ) {
    // Verify user is part of chat
    await this.getVerifyUserInChat(userId, chatId, deleted);

    // Use base service get method with joins
    return this.baseChatUserService.getAll(
      { _relations: ['user', 'chat'], _select: ['id', 'isAdmin', 'joinedAt', 'deletedAt', 'userId', 'unreadCount', 'user.id', 'user.firstName', 'user.lastName', 'user.email'] },
      undefined,
      {
        beforeQuery: (query) => {
          query.where('entity.chatId = :chatId', { chatId })
          return query;
        },
      },
      deleted
    );

  }

  /**
   * Get a chat
   */
  async getChat(chatId: string): Promise<Chat> {
    const chat = await this.baseChatService.getSingle(
      chatId,
      {
        _relations: ['lastMessage', 'chatUsers', 'chatUsers.user'],
        _select: ['chatUsers.id', 'chatUsers.isAdmin', 'chatUsers.unreadCount', 'chatUsers.joinedAt', 'chatUsers.user.id', 'chatUsers.user.firstName', 'chatUsers.user.lastName', 'chatUsers.user.email'],

      },
      undefined,
      {
        beforeQuery: (query) => {
          query.andWhere('chatUsers.deletedAt IS NULL');
          return query;
        },
      }
    );
    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  /**
   * Add user(s) to an existing chat
   * Creates system messages for each added user
   */
  async addUsersToChat(
    chatId: string,
    userIds: string[],
    addedBy: string,
  ): Promise<{ message: ChatMessage | undefined; chat: Chat }> {
    // Verify the user adding others is part of the chat and is an admin
    const chatUser = await this.getVerifyUserInChat(addedBy, chatId);

    // Get chat to check if it's a group
    const chat = await this.baseChatService.getSingle(chatId);
    if (!chat) throw new NotFoundException('Chat not found');

    // Only allow adding users to group chats
    if (!(chat as any).isGroup) {
      throw new ForbiddenException('Cannot add users to a single chat');
    }

    if (!chatUser.isAdmin) {
      throw new ForbiddenException('Only chat admins can add users to the chat');
    }

    // Get existing chat users (including soft-deleted ones)
    const existingChatUsers = await this.getChatParticipants(chatId, addedBy, true);

    const usersToAdd: string[] = [];
    const usersToRestore: ChatUser[] = [];

    // Separate users to add vs restore
    for (const userId of userIds) {
      const existingChatUser = existingChatUsers.find((cu) => cu.userId === userId);
      if (existingChatUser) {
        // User exists, restore if deleted
        if (existingChatUser.deletedAt) {
          usersToRestore.push(existingChatUser);
        }
      } else {
        // New user to add
        usersToAdd.push(userId);
      }
    }

    const newUsersCount = usersToAdd.length + usersToRestore.length;
    const currentParticipantCount = existingChatUsers.length - usersToRestore.length;

    // Maximum 100 users in a group chat
    if (currentParticipantCount + newUsersCount > this.MAX_GROUP_SIZE) {
      throw new ForbiddenException(
        `Group chat can have a maximum of ${this.MAX_GROUP_SIZE} users. Current: ${currentParticipantCount}, Trying to add: ${newUsersCount}`
      );
    }

    // Restore soft-deleted users
    for (const chatUserToRestore of usersToRestore) {
      await this.baseChatUserService.update(chatUserToRestore.id, {
        deletedAt: null,
        clearedAt: chatUserToRestore.deletedAt ? chatUserToRestore.deletedAt : undefined,
      } as any, undefined, true);
    }

    // Create new chat users
    for (const userId of usersToAdd) {
      await this.baseChatUserService.create({
        chatId,
        userId,
        joinedAt: new Date(),
        isAdmin: false,
      });
    }

    // Get all added/restored user IDs for system messages
    const allAddedUserIds = [...usersToAdd, ...usersToRestore.map((cu) => cu.userId)];

    if (allAddedUserIds.length === 0) {
      return { message: undefined, chat: chat as Chat };
    }

    // Get user details for system messages
    const addedUsersPromises = allAddedUserIds.map((id) =>
      this.baseUsersService.getSingle(id).catch(() => null)
    );
    const addedUsers = (await Promise.all(addedUsersPromises)).filter((u): u is User => u !== null);
    const addedByUser = await this.baseUsersService.getSingle(addedBy).catch(() => null);

    let message: ChatMessage | undefined;
    // Create system messages for each added/restored user
    for (const addedUserId of allAddedUserIds) {
      const addedUser = addedUsers.find((u) => u.id === addedUserId);
      if (addedUser) {
        message = await this.baseChatMessageService.create({
          chat: { id: chatId },
          sender: { id: addedBy },
          message: `${addedByUser?.firstName || 'Someone'} added ${addedUser.firstName || addedUser.email || 'a user'}`,
          messageType: 'system',
          metadata: {
            type: 'userAdd',
            addedUserId: addedUser.id,
            addedByUserId: addedBy,
            addedUserName: `${addedUser.firstName || ''} ${addedUser.lastName || ''}`.trim() || addedUser.email,
            addedByUserName: `${addedByUser?.firstName || ''} ${addedByUser?.lastName || ''}`.trim() || addedByUser?.email,
          },
        } as any);
        
      }
    }



    if (message) {
      await this.baseChatService.update(chatId, {
        lastMessageId: message.id,
      } as any);
    }

    // Return updated chat with relations
    return { message, chat: chat as Chat };
  }

  /**
   * Remove user from chat (soft delete)
   * Creates a system message when user is removed
   */
  async removeUserFromChat(
    chatId: string,
    userIdToRemove: string,
    removedBy: string,
  ): Promise<{ message: ChatMessage | undefined; chat: Chat }> {
    // Verify the user removing is part of the chat and is an admin
    const adminChatUser = await this.getVerifyUserInChat(removedBy, chatId);

    // Get chat to check if it's a group
    const chat = await this.baseChatService.getSingle(chatId);
    if (!chat) throw new NotFoundException('Chat not found');

    // Only allow removing users from group chats
    if (!(chat as any).isGroup) {
      throw new ForbiddenException('Cannot remove users from a single chat');
    }

    if (!adminChatUser.isAdmin) {
      throw new ForbiddenException('Only chat admins can remove users from the chat');
    }

    // Get the ChatUser entry to remove
    const chatUserToRemove = await this.baseChatUserService.getSingle({
      chatId,
      userId: userIdToRemove,
    });

    if (!chatUserToRemove) {
      throw new NotFoundException('User is not part of this chat');
    }

    // Get user details for system message
    const removedUser = await this.baseUsersService.getSingle(userIdToRemove).catch(() => null);
    const removedByUser = await this.baseUsersService.getSingle(removedBy).catch(() => null);

    // Soft delete by setting deletedAt
    await this.baseChatUserService.update(chatUserToRemove.id, {
      deletedAt: new Date(),
      deletedByUserId: removedBy,
    } as any);

    let message: ChatMessage | undefined;
    // Create system message
    if (removedUser) {
      message = await this.baseChatMessageService.create({
        chat: { id: chatId },
        sender: { id: removedBy }, // System message sent by the admin who removed the user
        message: `${removedByUser?.firstName || 'Someone'} removed ${removedUser.firstName || removedUser.email || 'a user'}`,
        messageType: 'system',
        metadata: {
          type: 'userRemove',
          removedUserId: removedUser.id,
          removedByUserId: removedBy,
          removedUserName: `${removedUser.firstName || ''} ${removedUser.lastName || ''}`.trim() || removedUser.email,
          removedByUserName: `${removedByUser?.firstName || ''} ${removedByUser?.lastName || ''}`.trim() || removedByUser?.email,
        },
      } as any);

      
    }

    if (message) {
      await this.baseChatService.update(chatId, {
        lastMessageId: message.id,
      } as any);
    }

    return { message, chat: chat as Chat };
  }


  /**
   * Make user admin of a chat
   */
  async makeUserAdmin(
    chatId: string,
    userIdToMakeAdmin: string,
    madeBy: string,
  ): Promise<void> {
    // Verify the user making others admin is part of the chat and is an admin
    const chatUser = await this.getVerifyUserInChat(madeBy, chatId);

    // Get chat to check if it's a group
    const chat = await this.baseChatService.getSingle(chatId);
    if (!chat) throw new NotFoundException('Chat not found');

    // Only allow making admins in group chats
    if (!(chat as any).isGroup) {
      throw new ForbiddenException('Cannot make admins in a single chat');
    }

    if (!chatUser.isAdmin) {
      throw new ForbiddenException('Only chat admins can make users admin');
    }

    // Get the ChatUser entry to make admin
    const chatUserToMakeAdmin = await this.baseChatUserService.getSingle({
      chatId,
      userId: userIdToMakeAdmin,
    });

    if (!chatUserToMakeAdmin) {
      throw new NotFoundException('User is not part of this chat');
    }

    // Update isAdmin to true
    await this.baseChatUserService.update(chatUserToMakeAdmin.id, {
      isAdmin: true,
    } as any);
  }

  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    chatIdOrRecipientId: string,
    message: string,
    file?: Express.Multer.File,
  ): Promise<ChatMessage> {
    let chat: Chat | null;


    // Get existing chat using CRUD service
    chat = await this.baseChatService.getSingle(chatIdOrRecipientId);

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }


    const chatUser = await this.getVerifyUserInChat(senderId, chat.id);

    if (!chatUser) {
      throw new ForbiddenException('You are not a participant of this chat');
    }


    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Handle file upload if provided
    let attachmentId: string | undefined;
    let messageType = 'text';

    if (file) {
      const uploadedFile = await this.fileUploadService.createFile(
        {
          name: file.originalname,
          folder: 'chat',
          type: EFileType.OTHER, // Will be auto-detected from mimetype
        },
        file,
      );
      attachmentId = uploadedFile.id;

      // Determine message type from file
      if (uploadedFile.type === EFileType.IMAGE) {
        messageType = 'image';
      } else if (uploadedFile.type === EFileType.AUDIO) {
        messageType = 'audio';
      } else {
        messageType = 'document';
      }
    }

    // Create message using BaseMessageService
    const savedMessage = await this.baseChatMessageService.create({
      chatId: chat.id,
      senderId,
      message: message || (file ? '📎 Attachment' : ''),
      messageType,
      attachmentId,
    } as any);

    // Update chat's last message using BaseChatService
    await this.baseChatService.update(chat.id, {
      lastMessageId: savedMessage.id,
    } as any);

    // Load relations for response using BaseMessageService
    const messageWithRelations = await this.baseChatMessageService.getSingle(
      savedMessage.id,
      { _relations: ['sender', 'chat', 'attachment'] },
    );

    if (!messageWithRelations) {
      throw new NotFoundException('Message not found after creation');
    }


    // Send notification to all other participants using BaseChatUserService
    const chatUsers = await this.getChatParticipants(chat.id, senderId, true);

    const otherParticipants = chatUsers.filter((cu) => cu.userId !== senderId);

    // Increment unreadCount for all other participants
    for (const participant of otherParticipants) {
      await this.baseChatUserService.update(participant.id, {
        unreadCount: (participant.unreadCount || 0) + 1,
        deletedAt: !chat.isGroup ? null : undefined,
        clearedAt: !chat.isGroup ? participant.deletedAt : undefined,
      } as any, undefined, true);
    }


    this.getChatParticipants(chat.id, senderId).then(async (chatUsers) => {
      const otherParticipants = chatUsers.filter((cu) => cu.userId !== senderId);
      for (const participant of otherParticipants) {
        try {
          await this.chatNotificationService.notifyNewMessage(
            messageWithRelations,
            chat,
            participant.userId,
          );
        } catch (error) {
          // Log but don't fail message sending
          console.error(
            `Failed to send chat notification to ${participant.userId}:`,
            error,
          );
        }
      }
    });

 

    return messageWithRelations;
  }

  /**
   * Get chats for a user with search, filters, and pagination
   */
  async getUserChats(userId: string, query: any) {
    const { level, search, ...rest } = query;

    return this.baseChatService.get(rest, ChatListDto, {
      beforeQuery: (qb) => {
        // 1️⃣ Filter chats by current user
        qb.innerJoin(
          'entity.chatUsers',
          'currentChatUser',
          'currentChatUser.userId = :userId AND currentChatUser.deletedAt IS NULL',
          { userId }
        );

        // 2️⃣ Load relations properly
        qb.leftJoin('entity.chatUsers', 'chatUsers')
          .leftJoin('chatUsers.user', 'user')
          .leftJoin('entity.lastMessage', 'lastMessage');

        // 3️⃣ Extra selected fields
        qb.addSelect([
          'lastMessage.message',
          'lastMessage.createdAt',
          'lastMessage.senderId',
          'chatUsers.id',
          'chatUsers.isAdmin',
          'chatUsers.deletedAt',
          'chatUsers.unreadCount',
          'currentChatUser.unreadCount',
          'user.id',
          'user.firstName',
          'user.lastName',
          'user.email',
        ]);

        // 4️⃣ Filter by level (EXISTS is correct)
        if (level) {
          qb.andWhere(
            `EXISTS (
              SELECT 1
              FROM chat_users cu
              INNER JOIN users u ON u.id = cu."userId"
              WHERE cu."chatId" = entity.id
                AND cu."deletedAt" IS NULL
                AND u.level = :level
            )`,
            { level }
          );
        }

        // 5️⃣ Search by user firstName and lastName
        if (search) {
          qb.andWhere(
            `(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search OR entity.name ILIKE :search OR lastMessage.message ILIKE :search)`,
            { search: `%${search}%` }
          );
        }

        // 6️⃣ Order by unread count (unread first), then by last message date (newest first)
        qb.orderBy('currentChatUser.unreadCount', 'DESC');
        qb.addOrderBy('lastMessage.createdAt', 'DESC');
        qb.addOrderBy('entity.updatedAt', 'DESC');

        return qb;
      },
    });
  }


  /**
   * Get messages for a chat with search
   * Filters messages based on user's clearedAt and deletedAt timestamps
   * Also filters messages deleted for this user in UserMessage
   */
  async getChatMessages(chatId: string, userId: string, query: any) {
    // Verify user is part of chat
    await this.getVerifyUserInChat(userId, chatId);


    return this.baseChatMessageService.get(query, ChatMessageListDto, {
      beforeQuery: (query) => {
        // Join with ChatUser to get clearedAt and deletedAt
        query
          .innerJoin('entity.chat', 'chat')
          .innerJoin(
            'chat.chatUsers',
            'chatUser',
            'chatUser.userId = :userId',
            { userId },
          )
          .leftJoin(
            'entity.chatUserMessages',
            'chatUserMessage',
            'chatUserMessage.userId = :userId',
            { userId },
          )
          .where('entity.chatId = :chatId', { chatId })

          // 🔒 HARD GROUPING
          .andWhere(
            new Brackets((qb) => {
              qb.where(
                'chatUser.clearedAt IS NULL AND chatUser.deletedAt IS NULL',
              ).orWhere(
                `entity.createdAt > GREATEST(
                COALESCE(chatUser.clearedAt, '1970-01-01'::timestamptz),
                COALESCE(chatUser.deletedAt, '1970-01-01'::timestamptz)
              )`,
              );
            }),
          )

          // 🔒 USER-SPECIFIC DELETE
          .andWhere(
            new Brackets((qb) => {
              qb.where('chatUserMessage.id IS NULL')
                .orWhere('chatUserMessage.deletedAt IS NULL');
            }),
          )
          .leftJoinAndSelect('entity.attachment', 'attachment')
          .leftJoinAndSelect('entity.sender', 'sender');


        return query;
      },
    });
  }

  /**
   * Reset unread count to 0 for a user in a chat
   */
  async resetUnreadCount(chatId: string, userId: string): Promise<void> {
    // Verify user is part of chat
    const chatUser = await this.getVerifyUserInChat(userId, chatId);

    // Reset unreadCount to 0
    await this.baseChatUserService.update(chatUser.id, {
      unreadCount: 0,
    } as any);
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    messageId: string,
    userId: string,
    deleteFor: 'everyone' | 'self',
  ): Promise<void> {
    const message = await this.baseChatMessageService.getSingle(messageId, {
      _relations: ['chat'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is part of chat
    await this.getVerifyUserInChat(userId, message.chatId);

    // Only sender can delete for everyone
    if (deleteFor === 'everyone' && message.senderId !== userId) {
      throw new ForbiddenException(
        'Only the sender can delete a message for everyone',
      );
    }

    if (deleteFor === 'everyone') {
      // Move original message to backupMessage before deleting
      await this.baseChatMessageService.update(messageId, {
        isDeleted: true,
        deletedBy: userId,
        message: 'This message is deleted by user',
        backupMessage: {
          message: message.message,
          messageType: message.messageType,
          metadata: message.metadata,
          attachmentId: message.attachmentId,
          deletedBy: userId,
          originalCreatedAt: message.createdAt,
        },
      } as any);
    } else {
      // For self deletion, create or update UserMessage with deletedAt
      // Check if UserMessage exists for this user
      const existingUserMessage = await this.baseChatUserMessageService.getSingle({
        messageId,
        userId,
      });

      if (existingUserMessage) {
        // Update existing UserMessage
        await this.baseChatUserMessageService.update(existingUserMessage.id, {
          deletedAt: new Date(),
          deletedByUserId: userId,
        });
      } else {
        // Create new UserMessage with deletedAt
        await this.baseChatUserMessageService.create({
          messageId,
          userId,
          deletedAt: new Date(),
          deletedByUserId: userId,
        } as any);
      }
    }
  }

  /**
   * Clear all messages in a chat
   */
  async clearChat(chatId: string, userId: string): Promise<void> {
    // Verify user is part of chat
    const chatUser = await this.getVerifyUserInChat(userId, chatId);


    await this.baseChatUserService.update(chatUser.id, {
      clearedAt: new Date(),
    } as any);
  }


  /**
   * Get message for WebSocket emission (used by controller)
   */
  async getMessageForWebSocket(messageId: string) {
    return this.baseChatMessageService.getSingle(messageId, {
      _relations: ['chat', 'attachment'],
    });
  }

  /**
   * Verify user is part of chat
   */
  async getVerifyUserInChat(userId: string, chatId: string, deleted?: boolean): Promise<ChatUser> {
    const chat = await this.baseChatService.getSingle(chatId);

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const chatUser = await this.baseChatUserService.getSingle(
      {
        chatId,
        userId,
      },
      undefined,
      undefined,
      undefined,
      deleted
    );

    if (!chatUser) {
      throw new ForbiddenException('You are not a participant of this chat');
    }

    return chatUser;
  }

  /**
   * Update chat (name only for group chats)
   */
  async updateChat(
    chatId: string,
    userId: string,
    dto: Partial<CreateChatDto>,
  ): Promise<IMessageResponse> {
    // Verify user is part of chat and is an admin
    const chatUser = await this.getVerifyUserInChat(userId, chatId);

    if (!chatUser.isAdmin) {
      throw new ForbiddenException('Only chat admins can update the chat');
    }

    // Get the chat
    const chat = await this.baseChatService.getSingle(chatId);

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Only allow updating name for group chats
    if (!(chat as any).isGroup) {
      throw new ForbiddenException('Cannot update single chat');
    }

    // Validate name is provided for group chats
    if (dto.name !== undefined) {
      if (!dto.name || dto.name.trim().length === 0) {
        throw new ForbiddenException('Group chat name is required');
      }
      await this.baseChatService.update(chatId, { name: dto.name.trim() } as any);
    }

    return { message: 'Chat updated successfully' };
  }

  /**
   * Delete chat for a user (soft delete)
   * Only hard deletes the chat when all participants have deleted it
   * If deleting user is an admin and no other admins exist, makes the first remaining member an admin
   */
  async deleteChat(chatId: string, userId: string): Promise<{ message: ChatMessage | undefined; chat: Chat }> {
    // Verify user is part of chat
    const chatUser = await this.getVerifyUserInChat(userId, chatId);

    // Get chat to check if it's a group
    const chat = await this.baseChatService.getSingle(chatId);
    if (!chat) throw new NotFoundException('Chat not found');

    // Check if deleting user is an admin
    const isDeletingUserAdmin = chatUser.isAdmin;

    // Mark as deleted for this user using BaseChatUserService
    await this.baseChatUserService.update(chatUser.id, {
      deletedAt: new Date(),
      isAdmin: false,
    } as any);

    // Get user details for system message
    const deletingUser = await this.baseUsersService.getSingle(userId).catch(() => null);

    let message: ChatMessage | undefined;
    // Create system message
    if (deletingUser) {
      message = await this.baseChatMessageService.create({
        chat: { id: chatId },
        sender: { id: userId },
        message: `${deletingUser.firstName || deletingUser.email || 'Someone'} left the chat`,
        messageType: 'system',
        metadata: {
          type: 'userLeave',
          leftUserId: deletingUser.id,
          leftUserName: `${deletingUser.firstName || ''} ${deletingUser.lastName || ''}`.trim() || deletingUser.email,
        },
      } as any);

    
    }

    if (message) {
      await this.baseChatService.update(chatId, {
        lastMessageId: message.id,
      } as any);
    }

    // If deleting user was an admin, check if there are other admins
    if (isDeletingUserAdmin) {
      // Get remaining admins (excluding the deleted user)
      const remainingAdmins = await this.baseChatUserService.getAll(
        { chatId },
        {} as any,
        {
          beforeQuery: (qb) => {
            qb.where('entity.chatId = :chatId', { chatId })
              .andWhere('entity.userId != :userId', { userId })
              .andWhere('entity.deletedAt IS NULL')
              .andWhere('entity.isAdmin = :isAdmin', { isAdmin: true });
          },
        },
      );

      // If no other admins exist, make the first remaining user an admin
      if (remainingAdmins.length === 0) {
        const firstRemainingUser = await this.baseChatUserService.getAll(
          { chatId },
          {} as any,
          {
            beforeQuery: (qb) => {
              qb.where('entity.chatId = :chatId', { chatId })
                .andWhere('entity.userId != :userId', { userId })
                .andWhere('entity.deletedAt IS NULL')
                .orderBy('entity.joinedAt', 'ASC')
                .limit(1);
            },
          },
        );

        if (firstRemainingUser.length > 0) {
          await this.baseChatUserService.update(firstRemainingUser[0].id, {
            isAdmin: true,
          } as any);
        }
      }
    }

    return { message, chat: chat as Chat };
  }
}
