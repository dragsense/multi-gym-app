import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { TrainerService } from '../entities/trainer-service.entity';
import { CreateTrainerServiceDto, UpdateTrainerServiceDto, UpdateTrainerServiceStatusDto } from '@shared/dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class TrainerServicesService extends CrudService<TrainerService> {
  constructor(
    @InjectRepository(TrainerService)
    private readonly trainerServiceRepo: Repository<TrainerService>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['title', 'description'],
      pagination: { defaultLimit: 10, maxLimit: 100 },
      defaultSort: { field: 'createdAt', order: 'DESC' },
    };

    super(trainerServiceRepo, moduleRef, crudOptions);
  }

  async createTrainerService(
    createTrainerServiceDto: CreateTrainerServiceDto,
  ): Promise<IMessageResponse & { trainerService: TrainerService }> {
    const trainerService = await this.create({
      ...createTrainerServiceDto,
    });

    return { message: 'Trainer service created successfully', trainerService };
  }

  async updateTrainerService(
    id: string,
    updateTrainerServiceDto: UpdateTrainerServiceDto,
  ): Promise<IMessageResponse> {
    await this.update(id, {
      ...updateTrainerServiceDto,
    });

    return { message: 'Trainer service updated successfully' };
  }

  async updateTrainerServiceStatus(
    id: string,
    updateStatusDto: UpdateTrainerServiceStatusDto,
  ): Promise<IMessageResponse> {
    await this.update(id, {
      status: updateStatusDto.status,
    });

    return { message: 'Trainer service status updated successfully' };
  }
}

