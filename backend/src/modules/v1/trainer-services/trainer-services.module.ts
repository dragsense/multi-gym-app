import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common/crud/crud.module';

import { TrainerService } from './entities/trainer-service.entity';
import { TrainerServicesService } from './services/trainer-services.service';
import { TrainerServicesController } from './controllers/trainer-services.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainerService]),
    CrudModule,
  ],
  controllers: [TrainerServicesController],
  providers: [TrainerServicesService],
  exports: [TrainerServicesService],
})
export class TrainerServicesModule {}

