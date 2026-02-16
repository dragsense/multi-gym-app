import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { Schedule } from './entities/schedule.entity';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleExecutorService } from './services/schedule-executor.service';
import { ScheduleProcessor } from './services/schedule.processor';
import { ScheduleSubscriber } from './subscribers/schedule.subscriber';
import { EventService } from '../helper/services/event.service';
import { Business } from '@/modules/v1/business/entities/business.entity';

@Module({
  imports: [
    NestScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Schedule, Business]),
    BullModule.registerQueue({ name: 'schedule' }),
  ],
  controllers: [ScheduleController],
  providers: [
    ScheduleService,
    ScheduleSubscriber,
    EventService,
    ScheduleExecutorService,
    ScheduleProcessor,
  ],
  exports: [ScheduleService],
})
export class ScheduleModule {}
