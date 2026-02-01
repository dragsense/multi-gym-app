import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAvailabilityService } from './user-availability.service';
import { UserAvailabilityController } from './user-availability.controller';
import { UserAvailability } from './entities/user-availability.entity';
import { CrudModule } from '@/common/crud/crud.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAvailability]),
    CrudModule,
  ],
  controllers: [UserAvailabilityController],
  providers: [UserAvailabilityService],
  exports: [UserAvailabilityService],
})
export class UserAvailabilityModule {}
