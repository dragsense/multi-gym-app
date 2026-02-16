import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { ServiceOffer } from '../entities/service-offer.entity';
import { CreateServiceOfferDto, UpdateServiceOfferDto, UpdateServiceOfferStatusDto } from '@shared/dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { RequestContext } from '@/common/context/request-context';
import { EUserLevels } from '@shared/enums';
import { User } from '@/common/base-user/entities/user.entity';
import { StaffService } from '../../staff/staff.service';

@Injectable()
export class ServiceOffersService extends CrudService<ServiceOffer> {
  constructor(
    @InjectRepository(ServiceOffer)
    private readonly serviceOfferRepo: Repository<ServiceOffer>,
    private readonly staffService: StaffService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name'],
      pagination: { defaultLimit: 10, maxLimit: 100 },
      defaultSort: { field: 'createdAt', order: 'DESC' },
    };

    super(serviceOfferRepo, moduleRef, crudOptions);
  }

  async createServiceOffer(
    createServiceOfferDto: CreateServiceOfferDto,
    currentUser: User,
  ): Promise<IMessageResponse & { serviceOffer: ServiceOffer }> {

    // If trainer is adding offer themselves, use their trainer ID from context
    let trainerId = createServiceOfferDto.trainer?.id;
    if (currentUser.level === EUserLevels.STAFF) {
      const trainer = await this.staffService.getSingle(
        { userId: currentUser.id, isTrainer: true },
      );
      trainerId = trainer?.id;
      if (!trainer) {
        throw new NotFoundException('Staff not found');
      }
    }

    const { trainerService, ...offerData } = createServiceOfferDto;

    const serviceOffer = await this.create({
      ...offerData,
      trainer: trainerId ? ({ id: trainerId } as any) : undefined,
      trainerService: trainerService?.id ? ({ id: trainerService.id } as any) : undefined,
    });

    return { message: 'Service offer created successfully', serviceOffer };
  }

  async updateServiceOffer(
    id: string,
    updateServiceOfferDto: UpdateServiceOfferDto,
    currentUser: User,
  ): Promise<IMessageResponse> {
    const { trainer, trainerService, ...offerData } = updateServiceOfferDto;

    let trainerId = trainer?.id;
    if (currentUser.level === EUserLevels.STAFF) {
      const trainer = await this.staffService.getSingle(
        { userId: currentUser.id, isTrainer: true },
      );
      trainerId = trainer?.id;
      if (!trainer) {
        throw new NotFoundException('Trainer not found');
      }
    }


    await this.update(id, {
      ...offerData,
      trainer: trainerId !== undefined
        ? ({ id: trainerId } as any)
        : undefined,
      trainerService: trainerService?.id !== undefined
        ? trainerService.id
          ? ({ id: trainerService.id } as any)
          : null
        : undefined,
    });

    return { message: 'Service offer updated successfully' };
  }

  async updateServiceOfferStatus(
    id: string,
    updateStatusDto: UpdateServiceOfferStatusDto,
  ): Promise<IMessageResponse> {
    await this.update(id, {
      status: updateStatusDto.status,
    });

    return { message: 'Service offer status updated successfully' };
  }
}

