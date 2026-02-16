import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '@/common/notification/notification.service';
import {
  ENotificationPriority,
  ENotificationType,
} from '@shared/enums/notification.enum';
import { ChatMessage } from '@/common/base-chat/entities/chat-message.entity';
import { Chat } from '@/common/base-chat/entities/chat.entity';

@Injectable()
export class ChatNotificationService {
  private readonly logger = new Logger(ChatNotificationService.name);

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Send notification to recipient when a new message is received
   */
  async notifyNewMessage(
    message: ChatMessage,
    chat: Chat,
    recipientId: string,
  ): Promise<void> {
    try {
      // Get sender name
      const senderName = message.sender?.firstName || 'Someone';
      
      await this.notificationService.createNotification({
        title: 'New Message',
        message: `${senderName} sent you a message: ${message.message.substring(0, 100)}${message.message.length > 100 ? '...' : ''}`,
        type: ENotificationType.INFO,
        priority: ENotificationPriority.NORMAL,
        entityId: recipientId,
        entityType: 'chat',
        metadata: {
          action: 'new_message',
          messageId: message.id,
          chatId: chat.id,
          senderId: message.senderId,
        },
      });

      this.logger.log(
        `✅ Notification sent for new message ${message.id} to user ${recipientId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for message ${message.id}: ${errorMessage}`,
      );
    }
  }
}

