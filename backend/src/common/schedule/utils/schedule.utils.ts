import { CronExpressionParser } from 'cron-parser';
import { DateTime } from 'luxon';
import { EScheduleFrequency, EDayOfWeek, EIntervalUnit } from '@shared/enums/schedule.enum';

export interface FrequencyConfig {
  frequency: EScheduleFrequency;
  weekDays?: EDayOfWeek[];
  monthDays?: number[];
  months?: number[];
}

export class ScheduleUtils {
  /**
   * Generate cron expression from frequency configuration
   */
  static generateCronExpression(
    frequencyConfig: FrequencyConfig,
    timeOfDay: string = '00:00',
    intervalMinutes: number = 0
  ): string {
    if (!frequencyConfig) {
      throw new Error('FrequencyConfig is required');
    }

    let [hours, minutes] = timeOfDay.split(':').map(Number);
  
    // Validate time components
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid timeOfDay format: ${timeOfDay}. Expected HH:MM format.`);
    }

    // Apply interval delay if provided
    if (intervalMinutes > 0) {
      const totalMinutes = hours * 60 + minutes + intervalMinutes;
      hours = Math.floor((totalMinutes % (24 * 60)) / 60);
      minutes = totalMinutes % 60;
    }
  
    let cronExpression: string;

    switch (frequencyConfig.frequency) {
      case EScheduleFrequency.DAILY:
        cronExpression = `${minutes} ${hours} * * *`;
        break;

      case EScheduleFrequency.WEEKLY:
        const days = frequencyConfig.weekDays?.join(',') || '*';
        cronExpression = `${minutes} ${hours} * * ${days}`;
        break;

      case EScheduleFrequency.MONTHLY:
        const dates = frequencyConfig.monthDays?.join(',') || '1';
        cronExpression = `${minutes} ${hours} ${dates} * *`;
        break;

      case EScheduleFrequency.YEARLY:
        const yearDates = frequencyConfig.monthDays?.join(',') || '1';
        const yearMonths = frequencyConfig.months?.map(m => m - 1).join(',') || '0'; // Cron months are 0-11
        cronExpression = `${minutes} ${hours} ${yearDates} ${yearMonths} *`;
        break;

      case EScheduleFrequency.ONCE:
        // For once, just return a cron that matches the specific date (handled separately)
        cronExpression = `${minutes} ${hours} * * *`;
        break;

      default:
        throw new Error(`Unsupported frequency type: ${frequencyConfig.frequency}`);
    }

    // Validate the generated cron expression has exactly 5 fields
    const cronParts = cronExpression.trim().split(/\s+/);
    if (cronParts.length !== 5) {
      throw new Error(`Generated invalid cron expression: "${cronExpression}". Expected 5 fields, got ${cronParts.length}.`);
    }

    return cronExpression;
  }

  /**
   * Calculate next run date using cron expression
   */
  static calculateNextRun(
    cronExpression: string,
    startDate: Date,
    endDate: Date | null,
    timezone: string = 'UTC',
  ): { nextRunAt: Date; isActive: boolean } {
    const now = DateTime.now().setZone(timezone);
    const start = DateTime.fromJSDate(startDate).setZone(timezone);
    const end = endDate ? DateTime.fromJSDate(endDate).setZone(timezone) : null;

    const options = {
      currentDate: start > now ? start.toJSDate() : now.toJSDate(),
      tz: timezone
    };

    try {
      const interval = CronExpressionParser.parse(cronExpression, options);
      const nextDate = DateTime.fromJSDate(interval.next().toDate()).setZone(timezone);

      // Check if next run is beyond end date
      if (end && nextDate > end) {
        return { nextRunAt: nextDate.toJSDate(), isActive: false };
      }

      return { nextRunAt: nextDate.toJSDate(), isActive: true };
    } catch (error: any) {
      throw new Error(`Failed to parse cron expression "${cronExpression}": ${error.message}`);
    }
  }

  /**
   * Get next run date from current date
   */
  static getNextRunDate(
    cronExpression: string,
    currentDate: Date,
    timezone: string = 'UTC',
  ): Date {
    const options = {
      currentDate,
      tz: timezone
    };

    try {
      const interval = CronExpressionParser.parse(cronExpression, options);
      return interval.next().toDate();
    } catch (error: any) {
      throw new Error(`Failed to get next run date: ${error.message}`);
    }
  }
}

