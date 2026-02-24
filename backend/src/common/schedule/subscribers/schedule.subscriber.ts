import {
  EntitySubscriberInterface,
  EventSubscriber,
  DataSource,
} from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { Injectable } from '@nestjs/common';

/**
 * Schedule entity subscriber.
 * Note: Setup on insert/update is triggered from ScheduleService.triggerSetupIfActive()
 * so it runs for both default and tenant DataSources. TypeORM subscribers only run
 * on the DataSource they are registered with (the default one), so when schedules
 * are created via tenant repository (e.g. from event listeners), this subscriber
 * would not run. The service-layer trigger ensures setup always runs.
 */
@Injectable()
@EventSubscriber()
export class ScheduleSubscriber implements EntitySubscriberInterface<Schedule> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Schedule;
  }
}
