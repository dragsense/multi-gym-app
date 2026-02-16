import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common/crud/crud.module';

import { ServiceOffer } from './entities/service-offer.entity';
import { ServiceOffersService } from './services/service-offers.service';
import { ServiceOffersController } from './controllers/service-offers.controller';
import { StaffModule } from '../staff/staff.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceOffer]),
    CrudModule,
    StaffModule,
  ],
  controllers: [ServiceOffersController],
  providers: [ServiceOffersService],
  exports: [ServiceOffersService],
})
export class ServiceOffersModule {}

