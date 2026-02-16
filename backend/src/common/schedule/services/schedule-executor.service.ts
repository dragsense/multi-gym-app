import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { ScheduleService } from '../schedule.service';
import { Schedule } from '../entities/schedule.entity';
import { LoggerService } from '../../logger/logger.service';
import { RequestContext } from '@/common/context/request-context';
import { Business } from '@/modules/v1/business/entities/business.entity';

@Injectable()
export class ScheduleExecutorService implements OnModuleInit {
  private readonly logger = new LoggerService(ScheduleExecutorService.name);

  constructor(
    private readonly scheduleService: ScheduleService,
    @InjectQueue('schedule') private scheduleQueue: Queue,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {}

  /**
   * Run on application boot
   * Get all schedules for today and set up Bull Queue jobs
   */
  async onModuleInit() {
    this.logger.log(
      '🚀 Application started - Setting up schedules for today...',
    );

    // this.setupDailySchedules(),
  }

  /**
   * Run at midnight (start of day)
   * Get all schedules for today and set up Bull Queue jobs
   * Iterates through all tenant databases to find schedules
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async setupDailySchedules() {
    this.logger.log('🕐 Setting up schedules for today...');

    // Clear previous jobs
    await this.cleanupPreviousSchedules();

    // First, get schedules from main database (platform-level schedules without tenantId)
    await this.setupSchedulesForTenant(null);

    // Get all businesses with tenantId from main database
    const businesses = await this.businessRepository.find({
      where: { tenantId: Not(IsNull()) },
      select: ['id', 'tenantId', 'name'],
    });

    this.logger.log(`Found ${businesses.length} business tenant(s) to check for schedules`);

    // Loop through each tenant and setup their schedules
    for (const business of businesses) {
      await this.setupSchedulesForTenant(business.tenantId);
    }

    this.logger.log('✅ Daily schedules setup completed for all tenants');
  }

  /**
   * Setup schedules for a specific tenant
   * @param tenantId - Tenant ID (null for main database)
   */
  private async setupSchedulesForTenant(tenantId: string | null): Promise<void> {
    const tenantLabel = tenantId ? `tenant ${tenantId}` : 'main database';
    
    // Execute within RequestContext.run() to set proper tenant context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const todaySchedules = await this.scheduleService.getTodaysSchedules();

        if (todaySchedules.length === 0) {
          this.logger.log(`No schedules for today in ${tenantLabel}`);
          return;
        }

        this.logger.log(`Found ${todaySchedules.length} schedule(s) for today in ${tenantLabel}`);

        for (const schedule of todaySchedules) {
          await this.setupSchedule(schedule);
        }
      } catch (error) {
        this.logger.error(`Failed to setup schedules for ${tenantLabel}: ${error.message}`);
      }
    });
  }

  /**
   * Clean up previous day's schedules from Bull queue
   */
  private async cleanupPreviousSchedules(): Promise<void> {
    try {
      this.logger.log("Cleaning up previous day's schedules...");

      // Get all jobs from the schedule queue with timeout
      const allJobs = await Promise.race([
        this.scheduleQueue.getJobs([
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout getting jobs')), 10000),
        ),
      ]);

      this.logger.log(`Found ${allJobs.length} jobs to clean up`);

      // Remove all jobs from the schedule queue with timeout protection
      const removePromises = allJobs.map(async (job) => {
        try {
          await Promise.race([
            job.remove(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout removing job')), 5000),
            ),
          ]);
          this.logger.log(`Removed job: ${job.id} from schedule queue`);
        } catch (error) {
          this.logger.error(`Failed to remove job ${job.id}: ${error.message}`);
        }
      });

      // Wait for all removals to complete
      await Promise.allSettled(removePromises);

      // Clean the queue completely with timeout protection
      await Promise.race([
        Promise.all([
          this.scheduleQueue.clean(0, 'completed'),
          this.scheduleQueue.clean(0, 'failed'),
        ]),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout cleaning queue')), 10000),
        ),
      ]);

      this.logger.log("Previous day's schedules cleaned up successfully");
    } catch (error) {
      this.logger.error(
        `Failed to cleanup previous schedules: ${error.message}`,
      );
      // Don't throw the error to prevent blocking the application startup
    }
  }

  /**
   * Setup individual schedule using Bull Queue repeat functionality
   */
  async setupSchedule(schedule: Schedule): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const nextRunDate = new Date(schedule.nextRunDate);
      nextRunDate.setHours(0, 0, 0, 0);

      if (nextRunDate.getTime() === today.getTime()) {
        await this.scheduleJob(schedule);
      }
    } catch (error) {
      this.logger.error(
        `Failed to setup schedule ${schedule.title}: ${error.message}`,
      );
    }
  }

  /**
   * Unified job scheduling using Bull Queue repeat functionality
   */
  private async scheduleJob(schedule: Schedule): Promise<void> {
    const timeOfDay = schedule.timeOfDay || '00:00';
    const [startHour, startMinute] = timeOfDay.split(':').map(Number);

    // Calculate start time for today
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);

    const jobOptions: any = {
      delay: startTime.getTime() - Date.now(),
      removeOnFail: schedule.retryOnFailure ? 50 : 0,
      attempts: schedule.retryOnFailure ? schedule.maxRetries : 1,
    };

    // If interval is specified, use Bull Queue repeat functionality
    if (schedule.interval) {
      const endTimeStr = schedule.endTime || '23:59';
      const [endHour, endMinute] = endTimeStr.split(':').map(Number);

      // Calculate end time for today
      const endTime = new Date();
      endTime.setHours(endHour, endMinute, 0, 0);

      // If end time has passed, set for tomorrow
      if (endTime <= new Date()) {
        endTime.setDate(endTime.getDate() + 1);
      }

      // Use Bull Queue repeat with interval
      jobOptions.repeat = {
        every: schedule.interval * 60 * 1000, // Convert minutes to milliseconds
        until: endTime,
      };
    }

    const job = await this.scheduleQueue.add(
      schedule.action,
      {
        ...schedule.data,
        date: schedule.nextRunDate,
        action: schedule.action,
        scheduleId: schedule.id,
        isRepeating: !!schedule.interval,
        entityId: schedule.entityId,
        tenantId: schedule.tenantId, // Include tenant context for multi-tenant database routing
      },
      jobOptions,
    );

    this.logger.log(
      `Scheduled job: ${schedule.title} at ${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')} (Job ID: ${job.id})`,
    );
  }
}
