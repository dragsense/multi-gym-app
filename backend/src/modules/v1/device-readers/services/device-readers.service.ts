import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { DeviceReader } from '../entities/device-reader.entity';
import { CreateDeviceReaderDto, UpdateDeviceReaderDto, UpdateDeviceReaderStatusDto } from '@shared/dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { LocationsService } from '../../locations/services/locations.service';

@Injectable()
export class DeviceReadersService extends CrudService<DeviceReader> {
  constructor(
    @InjectRepository(DeviceReader)
    private readonly deviceReaderRepo: Repository<DeviceReader>,
    private readonly locationsService: LocationsService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['deviceName', 'macAddress'],
      pagination: { defaultLimit: 10, maxLimit: 100 },
      defaultSort: { field: 'createdAt', order: 'DESC' },
    };

    super(deviceReaderRepo, moduleRef, crudOptions);
  }

  async createDeviceReader(
    createDeviceReaderDto: CreateDeviceReaderDto,
  ): Promise<IMessageResponse & { deviceReader: DeviceReader }> {
    if (!createDeviceReaderDto.location?.id) {
      throw new BadRequestException('Location is required');
    }

    const location = await this.locationsService.getSingle(createDeviceReaderDto.location.id);
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const deviceReader = await this.create(createDeviceReaderDto, {
      beforeCreate: (processedData: CreateDeviceReaderDto) => {
        return {
          ...processedData,
          location: {
            id: location.id,
          },
        };
      },
    });

    return { message: 'Device reader created successfully', deviceReader };
  }

  async updateDeviceReader(
    id: string,
    updateDeviceReaderDto: UpdateDeviceReaderDto,
  ): Promise<IMessageResponse> {
    // Validate location exists if provided
    if (updateDeviceReaderDto.location?.id) {
      const location = await this.locationsService.getSingle(updateDeviceReaderDto.location.id);
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    await this.update(id, updateDeviceReaderDto, {
      beforeUpdate: (processedData: UpdateDeviceReaderDto) => {
        return {
          ...processedData,
          ...(processedData.location?.id ? {
            location: {
              id: processedData.location.id,
            },
          } : {}),
        };
      },
    });

    return { message: 'Device reader updated successfully' };
  }

  async updateDeviceReaderStatus(
    id: string,
    updateStatusDto: UpdateDeviceReaderStatusDto,
  ): Promise<IMessageResponse> {
    await this.update(id, {
      status: updateStatusDto.status,
    });

    return { message: 'Device reader status updated successfully' };
  }
}
