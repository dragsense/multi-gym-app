import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { Door } from '../entities/door.entity';
import { CreateDoorDto, UpdateDoorDto } from '@shared/dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { CamerasService } from '../../../cameras/cameras.service';
import { DeviceReadersService } from '../../../device-readers/services/device-readers.service';

@Injectable()
export class DoorsService extends CrudService<Door> {
  constructor(
    @InjectRepository(Door)
    private readonly doorRepo: Repository<Door>,
    private readonly camerasService: CamerasService,
    private readonly deviceReadersService: DeviceReadersService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name', 'description'],
      pagination: { defaultLimit: 10, maxLimit: 100 },
      defaultSort: { field: 'createdAt', order: 'DESC' },
    };

    super(doorRepo, moduleRef, crudOptions);
  }

  async createDoor(
    createDoorDto: CreateDoorDto,
  ): Promise<IMessageResponse & { door: Door }> {
    // Validate device reader if provided
    if (createDoorDto.deviceReader?.id) {
      const deviceReader = await this.deviceReadersService.getSingle(createDoorDto.deviceReader.id, { _relations: ['door'] });
      if (!deviceReader) {
        throw new NotFoundException('Device reader not found');
      }
      
      // Validate device reader belongs to the same location as the door
      if (deviceReader.locationId !== createDoorDto.locationId) {
        throw new BadRequestException('Device reader does not belong to the specified location');
      }

      // Check if device reader is already attached to another door
      if (deviceReader.door && deviceReader.door.id) {
        throw new BadRequestException('Device reader is already attached to another door');
      }
    }

    // Validate camera if provided
    if (createDoorDto.camera?.id) {
      const camera = await this.camerasService.getSingle(createDoorDto.camera.id, { _relations: ['door'] });
      if (!camera) {
        throw new NotFoundException('Camera not found');
      }
      
      // Validate camera belongs to the same location as the door
      if (camera.locationId !== createDoorDto.locationId) {
        throw new BadRequestException('Camera does not belong to the specified location');
      }

      // Check if camera is already attached to another door
      if (camera.door && camera.door.id) {
        throw new BadRequestException('Camera is already attached to another door');
      }
    }

    const door = await this.create(createDoorDto, {
      beforeCreate: (processedData: CreateDoorDto) => {
        return {
          ...processedData,
          ...(processedData.deviceReader?.id ? {
            deviceReader: {
              id: processedData.deviceReader.id,
            },
          } : {}),
          ...(processedData.camera?.id ? {
            camera: {
              id: processedData.camera.id,
            },
          } : {}),
        };
      },
    });

    return { message: 'Door created successfully', door };
  }

  async updateDoor(
    id: string,
    updateDoorDto: UpdateDoorDto,
  ): Promise<IMessageResponse> {
    const existingDoor = await this.getSingle(id, { _relations: ['camera', 'deviceReader'] });
    if (!existingDoor) {
      throw new NotFoundException('Door not found');
    }

    // Determine target location (use updated location if provided, otherwise existing door location)
    const targetLocationId = updateDoorDto.locationId || existingDoor.locationId;

    // Validate device reader if provided
    if (updateDoorDto.deviceReader?.id) {
      const deviceReader = await this.deviceReadersService.getSingle(updateDoorDto.deviceReader.id, { _relations: ['door'] });
      if (!deviceReader) {
        throw new NotFoundException('Device reader not found');
      }
      
      // Validate device reader belongs to the target location
      if (deviceReader.locationId !== targetLocationId) {
        throw new BadRequestException('Device reader does not belong to the specified location');
      }

      // Check if device reader is already attached to a different door
      if (deviceReader.door && deviceReader.door.id !== id) {
        throw new BadRequestException('Device reader is already attached to another door');
      }
    }

    // Validate camera if provided
    if (updateDoorDto.camera?.id) {
      const camera = await this.camerasService.getSingle(updateDoorDto.camera.id, { _relations: ['door'] });
      if (!camera) {
        throw new NotFoundException('Camera not found');
      }
      
      // Validate camera belongs to the target location
      if (camera.locationId !== targetLocationId) {
        throw new BadRequestException('Camera does not belong to the specified location');
      }

      // Check if camera is already attached to a different door
      if (camera.door && camera.door.id !== id) {
        throw new BadRequestException('Camera is already attached to another door');
      }
    }

    await this.update(id, updateDoorDto, {
      beforeUpdate: (processedData: UpdateDoorDto) => {
        return {
          ...processedData,
          ...(processedData.deviceReader?.id ? {
            deviceReaderId: processedData.deviceReader.id,
          } : processedData.deviceReader === null ? {
            deviceReaderId: null,
          } : {}),
          ...(processedData.camera?.id ? {
            cameraId: processedData.camera.id,
          } : processedData.camera === null ? {
            cameraId: null,
          } : {}),
        };
      },
    });

    return { message: 'Door updated successfully' };
  }
}
