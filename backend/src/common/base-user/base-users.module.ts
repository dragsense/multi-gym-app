import { Module } from '@nestjs/common';

import { BaseUsersService } from './base-users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/common/base-user/entities/user.entity';
import { CrudModule } from '../crud/crud.module';
import { UserSeed } from './seeder/user.seed';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CrudModule],
  providers: [BaseUsersService, UserSeed],
  exports: [BaseUsersService, UserSeed],
})
export class BaseUserModule {}
