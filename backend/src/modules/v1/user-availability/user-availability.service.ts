import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { UserAvailability } from './entities/user-availability.entity';
import {
  CheckUserAvailabilityRequestDto,
  CreateUserAvailabilityDto,
} from '@shared/dtos/user-availability-dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { DateTime } from 'luxon';

@Injectable()
export class UserAvailabilityService extends CrudService<UserAvailability> {
  constructor(
    @InjectRepository(UserAvailability)
    private readonly userAvailabilityRepository: Repository<UserAvailability>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['user.password'],
    };
    super(userAvailabilityRepository, moduleRef, crudOptions);
  }

  async createOrUpdateUserAvailability(
    createUserAvailabilityDto: CreateUserAvailabilityDto,
    userId: string,
  ): Promise<UserAvailability> {
    let existingAvailability: UserAvailability | null = null;

    try {
      existingAvailability = await this.getSingle({
        userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        existingAvailability = null;
      }
    }

    if (existingAvailability) {
      return await this.update(
        existingAvailability.id,
        createUserAvailabilityDto,
      );
    } else {
      return await this.create({
        ...createUserAvailabilityDto,
        user: { id: userId },
      });
    }
  }

  /**
   * Check if a user is available at a specific date and time
   */
  async checkAvailabilityAtDateTime(
    userId: string,
    queryDto: CheckUserAvailabilityRequestDto,
    timezone: string = 'UTC',
  ): Promise<{ isAvailable: boolean; reason?: string }> {
    let availability: UserAvailability | null = null;

    try {
      availability = await this.getSingle({
        userId,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        // If no availability set, assume available
        return { isAvailable: true };
      }
      throw error;
    }

    if (!availability) {
      return { isAvailable: true };
    }

    const { dateTime, duration } = queryDto;

    const targetDateTime = DateTime.fromISO(dateTime, { zone: timezone });
    const endDateTime = targetDateTime.plus({ minutes: duration });
    const dayName = targetDateTime.toFormat('cccc').toLowerCase();

    // Check weekly schedule
    const daySchedule =
      availability.weeklySchedule?.[
        dayName as keyof typeof availability.weeklySchedule
      ];

    if (!daySchedule?.enabled || !daySchedule?.timeSlots?.length) {
      return {
        isAvailable: false,
        reason: `User is not available on ${dayName}`,
      };
    }

    // Check if the time slot fits within available time slots
    const targetTime = targetDateTime.toFormat('HH:mm');
    const endTime = endDateTime.toFormat('HH:mm');

    const fitsInSlot = daySchedule.timeSlots.some((slot) => {
      return targetTime >= slot.start && endTime <= slot.end;
    });

    if (!fitsInSlot) {
      return {
        isAvailable: false,
        reason: `Time slot ${targetTime}-${endTime} is not within available hours`,
      };
    }

    // Check unavailable periods
    if (availability.unavailablePeriods?.length > 0) {
      const dateStr = targetDateTime.toFormat('yyyy-MM-dd');
      const isInUnavailablePeriod = availability.unavailablePeriods.some(
        (period) => {
          if (!period.dateRange || !Array.isArray(period.dateRange)) {
            return false;
          }
          const [startDate, endDate] = period.dateRange;
          if (!startDate) return false;
          const end = endDate || startDate;
          return dateStr >= startDate && dateStr <= end;
        },
      );

      if (isInUnavailablePeriod) {
        return {
          isAvailable: false,
          reason: 'User has marked this date as unavailable',
        };
      }
    }

    return { isAvailable: true };
  }
}
