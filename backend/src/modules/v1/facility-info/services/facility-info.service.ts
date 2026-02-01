import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { FacilityInfo } from '../entities/facility-info.entity';
import { CreateFacilityInfoDto, UpdateFacilityInfoDto, UpdateFacilityInfoStatusDto } from '@shared/dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class FacilityInfoService extends CrudService<FacilityInfo> {
  constructor(
    @InjectRepository(FacilityInfo)
    private readonly facilityInfoRepo: Repository<FacilityInfo>,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['email', 'phone', 'address'],
      pagination: { defaultLimit: 10, maxLimit: 100 },
      defaultSort: { field: 'createdAt', order: 'DESC' },
    };

    super(facilityInfoRepo, moduleRef, crudOptions);
  }

  async createFacilityInfo(
    createFacilityInfoDto: CreateFacilityInfoDto,
  ): Promise<IMessageResponse & { facilityInfo: FacilityInfo }> {
    const facilityInfo = await this.create(createFacilityInfoDto);

    return { message: 'Facility info created successfully', facilityInfo };
  }

  async updateFacilityInfo(
    id: string,
    updateFacilityInfoDto: UpdateFacilityInfoDto,
  ): Promise<IMessageResponse> {
    await this.update(id, updateFacilityInfoDto);

    return { message: 'Facility info updated successfully' };
  }

  async updateFacilityInfoStatus(
    id: string,
    updateStatusDto: UpdateFacilityInfoStatusDto,
  ): Promise<IMessageResponse> {
    await this.update(id, {
      status: updateStatusDto.status,
    });

    return { message: 'Facility info status updated successfully' };
  }
}

