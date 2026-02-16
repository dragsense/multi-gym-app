import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common/crud/crud.module';

import { FacilityInfo } from './entities/facility-info.entity';
import { FacilityInfoService } from './services/facility-info.service';
import { FacilityInfoController } from './controllers/facility-info.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FacilityInfo]),
    CrudModule,
  ],
  controllers: [FacilityInfoController],
  providers: [FacilityInfoService],
  exports: [FacilityInfoService],
})
export class FacilityInfoModule {}

