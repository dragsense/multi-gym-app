import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  DataSource,
  UpdateEvent,
} from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { ScheduleExecutorService } from '../services/schedule-executor.service';
import { Injectable, Logger } from '@nestjs/common';
import { EScheduleStatus } from '@shared/enums/schedule.enum';

@Injectable()
@EventSubscriber()
export class ScheduleSubscriber implements EntitySubscriberInterface<Schedule> {
  private readonly logger = new Logger(ScheduleSubscriber.name);

  constructor(
    dataSource: DataSource,
    private readonly scheduleExecutor: ScheduleExecutorService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Schedule;
  }

  /**
   * Called after a schedule is inserted
   */
  async afterInsert(event: InsertEvent<Schedule>) {
    const schedule = event.entity;
    this.setupIfToday(schedule);
  }

  /**
   * Called after a schedule is updated
   */
  async afterUpdate(event: UpdateEvent<Schedule>) {
    const schedule = event.entity as Schedule;
    if (schedule) {
      this.setupIfToday(schedule);
    }
  }

  /**
   * Setup schedule immediately if it's for today
   */
  private setupIfToday(schedule: Schedule) {
    console.log('schedule', schedule);

    if (schedule.status !== EScheduleStatus.ACTIVE) return;
    setImmediate(() => {
      this.scheduleExecutor.setupSchedule(schedule).catch((err) => {
        this.logger.error(
          `❌ Failed to setup schedule "${schedule.title}": ${err.message}`,
        );
      });
    });
  }
}
