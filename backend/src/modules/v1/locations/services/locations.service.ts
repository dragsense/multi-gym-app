import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, ILike } from 'typeorm'; // Added ILike
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';
import { Location } from '../entities/location.entity';
import { CreateLocationDto, UpdateLocationDto } from '@shared/dtos';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { FileUploadService } from '@/common/file-upload/file-upload.service';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';
import { EFileType } from '@shared/enums';

@Injectable()
export class LocationsService extends CrudService<Location> {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    private readonly fileUploadService: FileUploadService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['name', 'address'],
      pagination: { defaultLimit: 10, maxLimit: 100 },
      defaultSort: { field: 'createdAt', order: 'DESC' },
    };

    super(locationRepo, moduleRef, crudOptions);
  }

  async createLocation(
    createLocationDto: CreateLocationDto,
    imageFile?: Express.Multer.File,
  ): Promise<IMessageResponse & { location: Location }> {
    const { image: _, ...locationData } = createLocationDto;

    const location = await this.create(locationData, {
      beforeCreate: async (
        processedData: CreateLocationDto,
        manager: EntityManager,
      ) => {
        // Normalize: remove leading/trailing spaces
        const normalizedName = processedData.name?.trim();

        // Check for existing name (Case-Insensitive)
        const existingLocation = await manager.findOne(Location, {
          where: {
            name: ILike(normalizedName),
          },
        });

        if (existingLocation) {
          throw new ConflictException('Location name already exists');
        }

        // Return data with trimmed name
        return {
          ...processedData,
          name: normalizedName,
        };
      },
      afterCreate: async (entity, manager) => {
        if (imageFile) {
          const uploaded = await this.fileUploadService.createFile(
            {
              name: imageFile.originalname,
              type: EFileType.IMAGE,
              folder: 'locations',
            },
            imageFile,
            false,
            manager,
          );
          entity.image = uploaded;
          await manager.save(entity);

          await this.fileUploadService.saveFiles([
            { file: imageFile, fileUpload: uploaded },
          ]);
        }
      },
    });

    return { message: 'Location created successfully', location };
  }

  async updateLocation(
    id: string,
    updateLocationDto: UpdateLocationDto,
    imageFile?: Express.Multer.File,
  ): Promise<IMessageResponse> {
    const { image: _, ...locationData } = updateLocationDto;

    await this.update(id, locationData, {
      beforeUpdate: async (
        processedData: UpdateLocationDto,
        existingEntity: Location,
        manager: EntityManager,
      ) => {
        if (processedData.name) {
          // Normalize the new name
          const normalizedName = processedData.name.trim();

          // Compare case-insensitively with current name
          if (normalizedName.toLowerCase() !== existingEntity.name.toLowerCase()) {
            const nameExists = await manager.findOne(Location, {
              where: { name: ILike(normalizedName) },
            });

            if (nameExists) {
              throw new ConflictException('Location name already exists');
            }
          }
          
          // Ensure the trimmed name is the one saved
          processedData.name = normalizedName;
        }

        return processedData;
      },
      afterUpdate: async (entity, manager) => {
        const location = await this.getSingle(id, {
          _relations: ['image'],
        });

        if (!location) {
          throw new NotFoundException('Location not found');
        }

        let oldImage: FileUpload | undefined | null = undefined;

        if (imageFile) {
          oldImage = location.image || undefined;
          const uploaded = await this.fileUploadService.createFile(
            {
              name: imageFile.originalname,
              type: EFileType.IMAGE,
              folder: 'locations',
            },
            imageFile,
            false,
            manager,
          );
          entity.image = uploaded;

          await this.fileUploadService.saveFiles([
            { file: imageFile, fileUpload: uploaded },
          ]);
        } else if (
          updateLocationDto.image == null ||
          updateLocationDto.image === 'null'
        ) {
          oldImage = location.image || undefined;
          entity.image = null;
        }

        await manager.save(entity);

        if (oldImage) {
          this.fileUploadService.deleteFiles([oldImage]).catch((error) => {
            this.logger.error(
              error instanceof Error ? error.message : String(error),
            );
          });
        }
      },
    });

    return { message: 'Location updated successfully' };
  }
}