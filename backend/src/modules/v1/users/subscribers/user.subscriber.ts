import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  DataSource,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { User } from '@/common/base-user/entities/user.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { UserAvailabilityService } from '../../user-availability/user-availability.service';
import { Profile } from '../profiles/entities/profile.entity';
import { DEFAULT_WEEKLY_SCHEDULE } from '../../user-availability/constants';

@EventSubscriber()
@Injectable()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  private readonly logger = new LoggerService(UserSubscriber.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly userAvailabilityService: UserAvailabilityService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  afterInsert(event: InsertEvent<User>): void {
    const user = event.entity;

    if (!user?.id) {
      this.logger.warn('User ID not found, skipping post-creation setup');
      return;
    }

    // Defer creation until after the transaction commits (100ms delay)
    setTimeout(() => {
      (async () => {
        try {
          await this.userAvailabilityService.create({
            user: { id: user.id },
            weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
            unavailablePeriods: [],
          });

          this.logger.log(
            `Default user availability created for user ${user.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to initialize user availability for user ${user.id}:`,
            error instanceof Error ? error.message : String(error),
          );
          // Don't throw the error to prevent user creation from failing
        }
      })().catch((err) => {
        this.logger.error(
          `Unhandled error creating user availability for user ${user.id}:`,
          err instanceof Error ? err.message : String(err),
        );
      });

      (async () => {
        await this.dataSource
          .getRepository(Profile)
          .upsert([{ user: { id: user.id } }], ['user']);
      })().catch((err) => {
        this.logger.error(
          `Unhandled error creating profile for user ${user.id}:`,
          err instanceof Error ? err.message : String(err),
        );
      });
    }, 100);
  }
}
