import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { BaseChatModule } from '@/common/base-chat/base-chat.module';
import { ServerGatewayModule } from '@/common/gateways/server-gateway.module';
import { NotificationModule } from '@/common/notification/notification.module';
import { ChatNotificationService } from './services/chat-notification.service';
import { ChatWebSocketService } from './services/chat-websocket.service';
import { BaseUserModule } from '@/common/base-user/base-users.module';
import { FileUploadModule } from '@/common/file-upload/file-upload.module';

@Module({
  imports: [BaseChatModule, ServerGatewayModule, NotificationModule, BaseUserModule, FileUploadModule],
  controllers: [ChatController],
  providers: [ChatService, ChatNotificationService, ChatWebSocketService],
  exports: [ChatService, ChatNotificationService, ChatWebSocketService],
})
export class ChatModule {}


