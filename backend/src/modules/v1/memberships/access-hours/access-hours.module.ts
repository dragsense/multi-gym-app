import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccessHoursService } from './access-hours.service';
import { AccessHoursController } from './access-hours.controller';
import { AccessHour } from './entities/access-hour.entity';
import { CrudModule } from '@/common/crud/crud.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessHour]),
    CrudModule,
  ],
  controllers: [AccessHoursController],
  providers: [AccessHoursService],
  exports: [AccessHoursService],
})
export class AccessHoursModule {}

