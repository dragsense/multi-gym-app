import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessFeaturesService } from './access-features.service';
import { AccessFeaturesController } from './access-features.controller';
import { AccessFeature } from './entities/access-feature.entity';
import { CrudModule } from '@/common/crud/crud.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessFeature]),
    CrudModule,
  ],
  controllers: [AccessFeaturesController],
  providers: [AccessFeaturesService],
  exports: [AccessFeaturesService],
})
export class AccessFeaturesModule {}

