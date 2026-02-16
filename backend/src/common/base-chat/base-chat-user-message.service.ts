import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { ChatUserMessage } from './entities/chat-user-message.entity';

@Injectable()
export class BaseChatUserMessageService extends CrudService<ChatUserMessage> {
  constructor(
    @InjectRepository(ChatUserMessage)
    private readonly chatUserMessageRepo: Repository<ChatUserMessage>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['messageId', 'userId'],
    };
    super(chatUserMessageRepo, moduleRef, crudOptions);
  }

  get chatUserMessageRepository(): Repository<ChatUserMessage> {
    return this.getRepository();
  }
}

