import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { ChatMessage } from './entities/chat-message.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class BaseChatMessageService extends CrudService<ChatMessage> {
  private readonly customLogger = new LoggerService(BaseChatMessageService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['message'],
    };
    super(chatMessageRepo, moduleRef, crudOptions);
  }

  /**
   * Get message repository
   */
  get chatMessageRepository(): Repository<ChatMessage> {
    return this.getRepository();
  }
}

