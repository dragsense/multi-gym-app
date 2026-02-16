import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '@/common/base-user/entities/user.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class BaseUsersService extends CrudService<User> {
  private readonly customLogger = new LoggerService(BaseUsersService.name);

  constructor(
    @InjectRepository(User)
    userRepo: Repository<User>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['password', 'passwordHistory'],
      searchableFields: ['email'],
    };
    super(userRepo, moduleRef, crudOptions);
  }

  async getUserByEmailWithPassword(email: string): Promise<User | null> {
    return this.getRepository().findOne({
      where: { email },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'isActive',
        'level',
        'password',
        'passwordHistory',
        'isVerified',
      ],
    });
  }

  async getUserByIdWithPassword(id: string): Promise<User | null> {
    return this.getRepository().findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'isActive',
        'level',
        'password',
        'passwordHistory',
        'isVerified',
      ],
    });
  }

  async getUserByIdWithTenantId(id: string, tenantId: string): Promise<User | null> {
    return this.getRepository(tenantId).findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'isActive',
        'level',
        'password',
        'passwordHistory',
        'isVerified',
      ],
    });
  }

  async getUserByIdWithRefUserId(id: string): Promise<User | null> {
    return this.getRepository().findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'isActive',
        'level',
        'isVerified',
        'refUserId',
        'isPlatformOwner',
      ],
    });
  }
}
