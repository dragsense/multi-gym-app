import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { BannerImage } from '../entities/banner-image.entity';
import { CreateBannerImageDto, UpdateBannerImageDto } from '@shared/dtos';
import { FileUploadService } from '@/common/file-upload/file-upload.service';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';
import { EFileType } from '@shared/enums';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class BannerImagesService extends CrudService<BannerImage> {
  constructor(
    @InjectRepository(BannerImage)
    private readonly bannerImageRepo: Repository<BannerImage>,
    private readonly fileUploadService: FileUploadService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name'],
      pagination: { defaultLimit: 10, maxLimit: 100 },
      defaultSort: { field: 'createdAt', order: 'DESC' },
    };

    super(bannerImageRepo, moduleRef, crudOptions);
  }

  async createBannerImage(
    createBannerImageDto: CreateBannerImageDto,
    imageFile?: Express.Multer.File,
  ): Promise<IMessageResponse & { bannerImage: BannerImage }> {
    const { image: _, ...bannerImageData } = createBannerImageDto;

    const bannerImage = await this.create(bannerImageData, {
      afterCreate: async (entity, manager) => {
        if (imageFile) {
          const uploaded = await this.fileUploadService.createFile(
            {
              name: imageFile.originalname,
              type: EFileType.IMAGE,
              folder: 'banner-images',
            },
            imageFile,
            false,
            manager,
          );
          entity.image = uploaded;
          await manager.save(entity);

          // Save the file after entity is saved
          await this.fileUploadService.saveFiles([
            { file: imageFile, fileUpload: uploaded },
          ]);
        }
      },
    });

    return { message: 'Banner image created successfully', bannerImage };
  }

  async updateBannerImage(
    id: string,
    updateBannerImageDto: UpdateBannerImageDto,
    imageFile?: Express.Multer.File,
  ): Promise<IMessageResponse> {
    const { image: _, ...bannerImageData } = updateBannerImageDto;

    await this.update(id, bannerImageData, {
      afterUpdate: async (entity, manager) => {
        const bannerImage = await this.getSingle(id, {
          _relations: ['image'],
        });

        if (!bannerImage) throw new NotFoundException('Banner image not found');

        let oldImage: FileUpload | undefined | null = undefined;

        if (imageFile) {
          oldImage = bannerImage.image || undefined;
          const uploaded = await this.fileUploadService.createFile(
            {
              name: imageFile.originalname,
              type: EFileType.IMAGE,
              folder: 'banner-images',
            },
            imageFile,
            false,
            manager,
          );
          entity.image = uploaded;

          // Save the file after entity is saved
          await this.fileUploadService.saveFiles([
            { file: imageFile, fileUpload: uploaded },
          ]);
        } else if (updateBannerImageDto.image == null || updateBannerImageDto.image === 'null') {
          oldImage = bannerImage.image || undefined;
          entity.image = null;
        }

        await manager.save(entity);

        // Delete old image if replaced
        if (oldImage) {
          this.fileUploadService.deleteFiles([oldImage]).catch((error) => {
            this.logger.error(
              error instanceof Error ? error.message : String(error),
            );
          });
        }
      },
    });

    return { message: 'Banner image updated successfully' };
  }
}

