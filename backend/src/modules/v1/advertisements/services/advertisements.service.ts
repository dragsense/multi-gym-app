import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { Advertisement } from '../entities/advertisement.entity';
import { CreateAdvertisementDto, UpdateAdvertisementDto, UpdateAdvertisementStatusDto } from '@shared/dtos';
import { BannerImagesService } from './banner-images.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { EAdvertisementStatus } from '@shared/enums/advertisement.enum';

@Injectable()
export class AdvertisementsService extends CrudService<Advertisement> {
  constructor(
    @InjectRepository(Advertisement)
    private readonly advertisementRepo: Repository<Advertisement>,
    private readonly bannerImagesService: BannerImagesService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['title'],
      pagination: { defaultLimit: 10, maxLimit: 100 },
      defaultSort: { field: 'createdAt', order: 'DESC' },
    };

    super(advertisementRepo, moduleRef, crudOptions);
  }

  async createAdvertisement(
    createAdvertisementDto: CreateAdvertisementDto,
  ): Promise<IMessageResponse & { advertisement: Advertisement }> {
    const { bannerImage, ...advertisementData } = createAdvertisementDto;

    const advertisement = await this.create(
      {
        ...advertisementData,
        startDate: new Date(createAdvertisementDto.startDate),
        endDate: new Date(createAdvertisementDto.endDate),
        bannerImage: bannerImage?.id
          ? ({ id: bannerImage.id } as any)
          : undefined,
      }
    );

    return { message: 'Advertisement created successfully', advertisement };
  }

  async updateAdvertisement(
    id: string,
    updateAdvertisementDto: UpdateAdvertisementDto,
  ): Promise<IMessageResponse> {
    const { bannerImage, ...advertisementData } = updateAdvertisementDto;

    await this.update(
      id,
      {
        ...advertisementData,
        startDate: updateAdvertisementDto.startDate
          ? new Date(updateAdvertisementDto.startDate)
          : undefined,
        endDate: updateAdvertisementDto.endDate
          ? new Date(updateAdvertisementDto.endDate)
          : undefined,
        bannerImage:
          bannerImage?.id !== undefined
            ? bannerImage.id
              ? ({ id: bannerImage.id } as any)
              : null
            : undefined,
      }
    );

    return { message: 'Advertisement updated successfully' };
  }

  async updateAdvertisementStatus(
    id: string,
    updateStatusDto: UpdateAdvertisementStatusDto,
  ): Promise<IMessageResponse> {
    await this.update(id, {
      status: updateStatusDto.status,
    });

    return { message: 'Advertisement status updated successfully' };
  }

  /**
   * Get currently active advertisements
   * - Status = ACTIVE
   * - startDate <= now
   * - endDate >= now
   */
  async getActiveAdvertisements(limit: number = 10): Promise<Advertisement[]> {
    const now = new Date();

    return this.getAll(
      {
        _relations: ['bannerImage', 'bannerImage.image'],
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      },
      undefined,
      {
        beforeQuery: (query: SelectQueryBuilder<Advertisement>) => {
          query
            .andWhere('entity.status = :status', { status: EAdvertisementStatus.ACTIVE })
            .andWhere('entity.startDate <= :now', { now })
            .andWhere('entity.endDate >= :now', { now })
            .take(limit);
          return query;
        },
      },
    );
  }
}

