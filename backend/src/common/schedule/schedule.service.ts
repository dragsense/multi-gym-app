import {
  Injectable,
  BadRequestException,
  Inject,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, MoreThanOrEqual, IsNull } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Schedule } from './entities/schedule.entity';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
} from '@shared/dtos/schedule-dtos/schedule.dto';
import {
  EScheduleStatus,
  EScheduleFrequency,
} from '@shared/enums/schedule.enum';
import { ScheduleUtils } from './utils/schedule.utils';
import { CrudService } from '@/common/crud/crud.service';
import { ScheduleExecutorService } from './services/schedule-executor.service';

@Injectable()
export class ScheduleService extends CrudService<Schedule> implements OnModuleInit {


  private executorService!: ScheduleExecutorService;
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepo: Repository<Schedule>,
    moduleRef: ModuleRef,
  ) {
    super(scheduleRepo, moduleRef);
  }

  async onModuleInit(): Promise<void> {
    await super.onModuleInit();
    this.executorService = this.moduleRef.get(ScheduleExecutorService, { strict: false });
  }

  /**
   * Trigger executor setup when a schedule is saved (insert/update).
   * Needed because TypeORM subscribers only run on the default DataSource;
   * when schedules are created via tenant DataSource (e.g. from event listeners),
   * the subscriber never runs, so we call the executor explicitly here.
   */
  private triggerSetupIfActive(schedule: Schedule): void {
    if (schedule?.status !== EScheduleStatus.ACTIVE) return;
    setImmediate(() => {
      try {
        if (this.executorService) {
          this.executorService.setupSchedule(schedule).catch((err: Error) => {
            this.logger.error(
              `Failed to setup schedule "${schedule.title}": ${err.message}`,
            );
          });
        }
      } catch {
        // ModuleRef may throw if ScheduleExecutorService not available (e.g. in tests)
      }
    });
  }

  /**
   * Create schedule and calculate first nextRunDate
   */
  async createSchedule(
    createDto: CreateScheduleDto,
    timezone?: string,
    manager?: EntityManager,
  ): Promise<Schedule> {
    // Check for existing schedule to prevent duplicates
    // For reminders, check if a schedule with the same entityId, action, and recipientId already exists
    if (createDto.entityId && createDto.action) {
      // Build query to check for existing schedule
      const repository = this.getRepository();
      const queryBuilder = repository
        .createQueryBuilder('schedule')
        .where('schedule.entityId = :entityId', {
          entityId: createDto.entityId,
        })
        .andWhere('schedule.action = :action', { action: createDto.action })
        .andWhere('schedule.status = :status', {
          status: EScheduleStatus.ACTIVE,
        });

      // Also check recipientId in data if present to prevent duplicate reminders for same recipient
      if (createDto.data?.recipientId) {
        queryBuilder.andWhere("schedule.data->>'recipientId' = :recipientId", {
          recipientId: createDto.data.recipientId,
        });
      }

      const existingSchedule = await queryBuilder.getOne();

      if (existingSchedule) {
        // Update existing schedule instead of creating duplicate
        const overrideNextRunDate = createDto.nextRunDate
          ? new Date(createDto.nextRunDate)
          : undefined;
        if (overrideNextRunDate) {
          if (Number.isNaN(overrideNextRunDate.getTime())) {
            throw new BadRequestException('nextRunDate must be a valid date');
          }
          existingSchedule.nextRunDate = overrideNextRunDate;
        }
        existingSchedule.title = createDto.title || existingSchedule.title;
        existingSchedule.description =
          createDto.description || existingSchedule.description;
        if (createDto.data) {
          existingSchedule.data = {
            ...existingSchedule.data,
            ...createDto.data,
          };
        }
        const saved = manager
          ? await manager.save(existingSchedule)
          : await repository.save(existingSchedule);
        this.triggerSetupIfActive(saved as Schedule);
        return saved;
      }
    }

    // Validate frequency-specific fields 
    this.validateScheduleConfig(createDto);

    // Keep dates with timezone info as sent from frontend
    const startDate = new Date(createDto.startDate || new Date());
    const endDate = createDto.endDate
      ? new Date(new Date(createDto.endDate).setHours(23, 59, 59, 999))
      : undefined;
    const selectedTimezone = createDto.timezone || timezone || 'UTC';
    // Generate cron expression
    const cronExpression =
      createDto.frequency === EScheduleFrequency.ONCE ? undefined :
        ScheduleUtils.generateCronExpression(
          {
            frequency: createDto.frequency as EScheduleFrequency,
            weekDays: createDto.weekDays,
            monthDays: createDto.monthDays,
            months: createDto.months,
          },
          createDto.timeOfDay || '00:00',
          0, // No delay for first run
        );

    let nextRunAt: Date = startDate;
    let isActive = !endDate || startDate <= endDate;



    const repository = this.getRepository();
    const schedule = repository.create({
      ...createDto,
      frequency: createDto.frequency || EScheduleFrequency.ONCE,
      timezone: selectedTimezone,
      startDate,
      endDate,
      cronExpression,
      status: isActive ? EScheduleStatus.ACTIVE : EScheduleStatus.COMPLETED,
      nextRunDate: nextRunAt,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    });

    const saved = manager
      ? await manager.save(schedule)
      : await repository.save(schedule);
    this.triggerSetupIfActive(saved as Schedule);
    return saved;
  }

  /**
   * Track successful execution
   */
  async trackExecution(
    id: string,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    const schedule = await this.getSingle(id);

    if (!schedule) throw new NotFoundException('Schedule Not Found.');

    schedule.executionCount += 1;
    schedule.lastRunAt = new Date();
    schedule.lastExecutionStatus = success ? 'success' : 'failed';

    if (success) {
      schedule.successCount += 1;
      schedule.lastErrorMessage = undefined;
    } else {
      schedule.failureCount += 1;
      schedule.lastErrorMessage = errorMessage || 'Unknown error';
    }

    // Update execution history (keep last 50)
    const history = schedule.executionHistory || [];
    history.unshift({
      executedAt: new Date(),
      status: success ? 'success' : 'failed',
      errorMessage: success ? undefined : errorMessage,
    });

    // Keep only last 50 executions
    schedule.executionHistory = history.slice(0, 50);

    const repository = this.getRepository();
    await repository.save(schedule);
  }

  /**
   * Validate schedule configuration based on frequency
   */
  private validateScheduleConfig(dto: CreateScheduleDto | any): void {
    switch (dto.frequency) {
      case EScheduleFrequency.WEEKLY:
        if (!dto.weekDays || dto.weekDays.length === 0) {
          throw new BadRequestException(
            'weekDays is required for WEEKLY frequency',
          );
        }
        break;

      case EScheduleFrequency.MONTHLY:
        if (!dto.monthDays || dto.monthDays.length === 0) {
          throw new BadRequestException(
            'monthDays is required for MONTHLY frequency',
          );
        }
        break;

      case EScheduleFrequency.YEARLY:
        if (!dto.months || dto.months.length === 0) {
          throw new BadRequestException(
            'months is required for YEARLY frequency',
          );
        }
        break;
    }
  }

  /**
   * Get schedule by ID (alias for findOne)
   */
  async getScheduleById(id: string): Promise<Schedule> {
    const schedule = await this.getSingle(id);

    if (!schedule) throw new NotFoundException('Schedule Not Found.');

    return schedule;
  }

  /**
   * Get all schedules that should run today
   */
  async getTodaysSchedules(): Promise<Schedule[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const repository = this.getRepository();

    return await repository.find({
      where: {
        status: EScheduleStatus.ACTIVE,
        nextRunDate: MoreThanOrEqual(today),
        deletedAt: IsNull(),
      },
      order: { timeOfDay: 'ASC' },
    });
  }

  /**
   * Execute schedule and update nextRunDate
   */
  async executeAndUpdateNext(id: string): Promise<Schedule> {
    const schedule = await this.getSingle(id);

    if (!schedule) throw new NotFoundException('Schedule Not Found.');

    schedule.lastRunAt = new Date();

    // Calculate next run date using cron expression
    if (schedule.frequency === EScheduleFrequency.ONCE) {
      schedule.status = EScheduleStatus.COMPLETED;
    } else if (schedule.cronExpression) {
      const timezone = schedule.timezone || 'UTC';
      const nextRunAt = ScheduleUtils.getNextRunDate(
        schedule.cronExpression,
        new Date(),
        timezone,
      );

      // Check if next run is beyond end date
      if (schedule.endDate && nextRunAt > schedule.endDate) {
        schedule.status = EScheduleStatus.COMPLETED;
      } else {
        schedule.nextRunDate = nextRunAt;
      }
    }

    const repository = this.getRepository();
    return await repository.save(schedule);
  }

  async updateSchedule(
    id: string,
    updateData: UpdateScheduleDto,
    timezone?: string,
    manager?: EntityManager,
  ): Promise<Schedule> {
    const schedule = await this.getSingle(id);

    if (!schedule) throw new NotFoundException('Schedule Not Found.');

    // If frequency-related fields changed, recalculate cron and nextRunDate
    if (
      updateData.startDate ||
      updateData.frequency ||
      updateData.timeOfDay ||
      updateData.weekDays !== undefined ||
      updateData.monthDays ||
      updateData.months
    ) {
      // Merge with existing schedule for validation
      const merged = { ...schedule, ...updateData };
      this.validateScheduleConfig(merged);

      const newStartDate = updateData.startDate
        ? new Date(updateData.startDate)
        : schedule.startDate;

      const newEndDate =
        updateData.endDate !== undefined
          ? updateData.endDate
            ? new Date(new Date(updateData.endDate).setHours(23, 59, 59, 999))
            : undefined
          : schedule.endDate;

      const selectedTimezone = merged.timezone || timezone || 'UTC';

      // Regenerate cron expression
      const cronExpression = ScheduleUtils.generateCronExpression(
        {
          frequency: merged.frequency,
          weekDays: merged.weekDays,
          monthDays: merged.monthDays,
          months: merged.months,
        },
        merged.timeOfDay || '00:00',
        0,
      );

      // Calculate next run date
      const { nextRunAt, isActive } = ScheduleUtils.calculateNextRun(
        cronExpression,
        newStartDate,
        newEndDate || null,
        selectedTimezone,
      );

      Object.assign(schedule, updateData, {
        startDate: newStartDate,
        endDate: newEndDate,
        cronExpression,
        nextRunDate: nextRunAt,
        status: isActive ? schedule.status : EScheduleStatus.COMPLETED,
        timezone: selectedTimezone,
      });
    } else {
      Object.assign(schedule, updateData);
    }

    const repository = this.getRepository();
    return manager
      ? await manager.save(schedule)
      : await repository.save(schedule);
  }
}
