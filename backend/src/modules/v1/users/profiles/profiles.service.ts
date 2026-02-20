import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { IMessageResponse } from '@shared/interfaces';
import { CrudService } from '@/common/crud/crud.service';

import { Profile } from './entities/profile.entity';

import { UpdateProfileDto } from '@shared/dtos/user-dtos/profile.dto';
import { FileUploadService } from '@/common/file-upload/file-upload.service';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';
import { EFileType } from '@shared/enums';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

@Injectable()
export class ProfilesService extends CrudService<Profile> {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    private readonly fileUploadService: FileUploadService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['firstName', 'lastName'],
      pagination: { defaultLimit: 10, maxLimit: 100 },
      defaultSort: { field: 'createdAt', order: 'DESC' },
    };

    super(profileRepo, moduleRef, crudOptions);
  }

  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
    profileImage?: Express.Multer.File,
    documents?: Express.Multer.File[],
  ): Promise<IMessageResponse> {
    const {
      image,
      documents: _,
      removedDocumentIds,
      ...profileData
    } = updateProfileDto;

    // Use callbacks to handle file uploads during update
    await this.update(id, profileData, {
      afterUpdate: async (entity, manager) => {
        // Handle profile image upload
        let uploaded: FileUpload | null = null;
        let oldImage: FileUpload | undefined | null = undefined;

        const profile = await this.getSingle(id, {
          _relations: ['documents', 'image'],
        });

        if (!profile) throw new NotFoundException('Profile not found');

        if (profileImage) {
          oldImage = profile.image;
          uploaded = await this.fileUploadService.createFile(
            {
              name: profileImage.originalname,
              type: EFileType.IMAGE,
            },
            profileImage,
            false,
            manager,
          );
          entity.image = uploaded;
        } else if (image === null || image === 'null') {
          oldImage = profile.image;
          entity.image = null;
        }

        let documentsToRemove: FileUpload[] = [];

        // Handle document removal first
        if (removedDocumentIds && removedDocumentIds.length > 0) {
          documentsToRemove =
            profile.documents?.filter((doc) =>
              removedDocumentIds.includes(doc.id),
            ) || [];

          if (documentsToRemove.length > 0) {
            profile.documents =
              profile.documents?.filter(
                (doc) => !documentsToRemove.some((d) => d.id === doc.id),
              ) || [];
          }
          entity.documents = profile.documents;
        }

        const uploadedDocuments: {
          fileUpload: FileUpload;
          file: Express.Multer.File;
        }[] = [];

        // Handle documents upload (up to 10 files)
        if (documents && documents.length > 0) {
          // Limit to 10 documents
          const filesToUpload = documents.slice(0, 10);

          for (const doc of filesToUpload) {
            const uploaded = await this.fileUploadService.createFile(
              {
                name: doc.originalname,
                type: EFileType.DOCUMENT,
              },
              doc,
              false,
              manager,
            );
            uploadedDocuments.push({ fileUpload: uploaded, file: doc });
          }

          // Append new documents to existing ones (if any)
          if (profile.documents) {
            profile.documents = [
              ...profile.documents,
              ...uploadedDocuments.map((doc) => doc.fileUpload),
            ];
          } else {
            profile.documents = uploadedDocuments.map((doc) => doc.fileUpload);
          }

          // Ensure we don't exceed 10 documents total
          if (profile.documents && profile.documents.length > 10) {
            profile.documents = profile.documents.slice(-10);
          }
          entity.documents = profile.documents;
        }

        const saveFilePromises: Promise<void>[] = [];

        if (uploaded && profileImage) {
          saveFilePromises.push(
            this.fileUploadService.saveFiles([
              { file: profileImage, fileUpload: uploaded },
            ]),
          );
        }
        if (uploadedDocuments.length > 0) {
          saveFilePromises.push(
            this.fileUploadService.saveFiles(
              uploadedDocuments.map((doc) => ({
                file: doc.file,
                fileUpload: doc.fileUpload,
              })),
            ),
          );
        }

        if (saveFilePromises.length > 0) {
          await Promise.all(saveFilePromises);
        }

        await manager.save(entity);

        if (oldImage) {
          console.log('oldImage', oldImage);
          this.fileUploadService.deleteFiles([oldImage]).catch((error) => {
            this.logger.error(
              error instanceof Error ? error.message : String(error),
            );
          });
        }

        if (documentsToRemove.length > 0) {
          this.fileUploadService
            .deleteFiles(documentsToRemove)
            .catch((error) => {
              this.logger.error(
                error instanceof Error ? error.message : String(error),
              );
            });
        }
      },
    });

    return { message: 'Profile updated successfully' };
  }

}
