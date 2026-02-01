import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { ChatUser } from './entities/chat-user.entity';

@Injectable()
export class BaseChatUserService extends CrudService<ChatUser> {
  constructor(
    @InjectRepository(ChatUser)
    private readonly chatUserRepo: Repository<ChatUser>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['userId', 'chatId'],
    };
    super(chatUserRepo, moduleRef, crudOptions);
  }

  get chatUserRepository(): Repository<ChatUser> {
    return this.getRepository();
  }
}

