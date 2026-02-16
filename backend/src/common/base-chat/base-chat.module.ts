import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatUser } from './entities/chat-user.entity';
import { ChatUserMessage } from './entities/chat-user-message.entity';
import { BaseChatService } from './base-chat.service';
import { BaseChatMessageService } from './base-chat-message.service';
import { BaseChatUserService } from './base-chat-user.service';
import { BaseChatUserMessageService } from './base-chat-user-message.service';
import { CrudModule } from '../crud/crud.module';

@Module({
  imports: [TypeOrmModule.forFeature([Chat, ChatMessage, ChatUser, ChatUserMessage]), CrudModule],
  providers: [BaseChatService, BaseChatMessageService, BaseChatUserService, BaseChatUserMessageService],
  exports: [BaseChatService, BaseChatMessageService, BaseChatUserService, BaseChatUserMessageService],
})
export class BaseChatModule {}


