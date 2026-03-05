import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { IMessageResponse } from '@shared/interfaces';
import { User } from '@/common/base-user/entities/user.entity';

@Injectable()
export class SubscriptionsService extends CrudService<Subscription> {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: [],
      searchableFields: ['name', 'description'],
      superAdminOwnDataOnly: false
    };
    super(subscriptionRepo, moduleRef, crudOptions);
  }
}
