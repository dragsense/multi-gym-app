import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { AccessHour } from './entities/access-hour.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { IMessageResponse } from '@shared/interfaces';
import { CreateAccessHourDto, UpdateAccessHourDto } from '@shared/dtos';

@Injectable()
export class AccessHoursService extends CrudService<AccessHour> {
  private readonly customLogger = new LoggerService(AccessHoursService.name);

  constructor(
    @InjectRepository(AccessHour)
    private readonly accessHourRepo: Repository<AccessHour>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name', 'description'],
    };
    super(accessHourRepo, moduleRef, crudOptions);
  }

  async createAccessHour(
    createAccessHourDto: CreateAccessHourDto,
  ): Promise<IMessageResponse & { accessHour: AccessHour }> {
    // Validate that end time is after start time
    if (createAccessHourDto.startTime && createAccessHourDto.endTime) {
      const [startHours, startMinutes] = createAccessHourDto.startTime.split(':').map(Number);
      const [endHours, endMinutes] = createAccessHourDto.endTime.split(':').map(Number);

      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;

      if (endTotalMinutes <= startTotalMinutes) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    const accessHour = await this.create(createAccessHourDto);

    return {
      message: 'Access hour created successfully',
      accessHour,
    };
  }

  async updateAccessHour(
    id: string,
    updateAccessHourDto: UpdateAccessHourDto,
  ): Promise<IMessageResponse & { accessHour: AccessHour }> {
    // Validate that end time is after start time if both are provided
    if (updateAccessHourDto.startTime && updateAccessHourDto.endTime) {
      const [startHours, startMinutes] = updateAccessHourDto.startTime.split(':').map(Number);
      const [endHours, endMinutes] = updateAccessHourDto.endTime.split(':').map(Number);

      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;

      if (endTotalMinutes <= startTotalMinutes) {
        throw new BadRequestException('End time must be after start time');
      }
    }

    const accessHour = await this.update(id, updateAccessHourDto);

    return {
      message: 'Access hour updated successfully',
      accessHour,
    };
  }

}

