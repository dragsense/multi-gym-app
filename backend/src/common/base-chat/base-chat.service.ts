import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatUser } from './entities/chat-user.entity';
import { ChatUserMessage } from './entities/chat-user-message.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class BaseChatService extends CrudService<Chat> {
  private readonly customLogger = new LoggerService(BaseChatService.name);

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepo: Repository<Chat>,
    moduleRef: ModuleRef,
    protected readonly entityRouterService: EntityRouterService,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name'],
    };
    super(chatRepo, moduleRef, crudOptions);
  }

  /**
   * Get chat repository
   */
  get chatRepository(): Repository<Chat> {
    return this.getRepository();
  }

  /**
   * Get message repository
   */
  get messageRepository(): Repository<ChatMessage> {
    return this.entityRouterService.getRepository<ChatMessage>(ChatMessage);
  }

  /**
   * Get chat user repository
   */
  get chatUserRepository(): Repository<ChatUser> {
    return this.entityRouterService.getRepository<ChatUser>(ChatUser);
  }

  /**
   * Get user message repository
   */
  get chatUserMessageRepository(): Repository<ChatUserMessage> {
    return this.entityRouterService.getRepository<ChatUserMessage>(ChatUserMessage);
  }
}


