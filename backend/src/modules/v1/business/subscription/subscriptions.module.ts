import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { Subscription } from './entities/subscription.entity';
import { CrudModule } from '@/common/crud/crud.module';
import { User } from '@/common/base-user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, User]), CrudModule],
  exports: [SubscriptionsService],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
  ],
})
export class SubscriptionsModule { }
