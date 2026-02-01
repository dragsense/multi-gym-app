import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CheckinSnapshot } from '../entities/checkin-snapshot.entity';
import { Checkin } from '../entities/checkin.entity';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { FileUploadService } from '@/common/file-upload/file-upload.service';
import { EFileType } from '@shared/enums';
import { CheckinsService } from '../checkins.service';

@Injectable()
export class CheckinSnapshotsService extends CrudService<CheckinSnapshot> {
  constructor(
    @InjectRepository(CheckinSnapshot)
    private readonly checkinSnapshotRepo: Repository<CheckinSnapshot>,
    private readonly fileUploadService: FileUploadService,
    private readonly checkinsService: CheckinsService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: ['sequence'],
    };
    super(checkinSnapshotRepo, moduleRef, crudOptions);
  }

  /**
   * Create a checkin snapshot with image
   * Used by camera snapshot processor to store captured snapshots
   */
  async createCheckinSnapshot(
    checkinId: string,
    sequence: number,
    imageFile: Express.Multer.File,
  ): Promise<CheckinSnapshot> {
    // Verify checkin exists using service (handles tenant context)
    const checkin = await this.checkinsService.getSingle(checkinId);
    if (!checkin) {
      throw new NotFoundException(`Checkin ${checkinId} not found`);
    }

    // Get tenant-specific repository using EntityManager
    const repository = this.getRepository();
    const dataSource = repository.manager.connection;
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create file upload with tenant context
      const fileName = `checkin-${checkinId}-snapshot-${sequence}-${Date.now()}.jpg`;
      const fileUpload = await this.fileUploadService.createFile(
        {
          name: fileName,
          type: EFileType.IMAGE,
          folder: 'checkin-snapshots',
        },
        imageFile,
        false, // Don't save file yet, will be saved by saveFiles
        queryRunner.manager, // Use transaction manager for tenant context
      );

      // Create CheckinSnapshot using tenant-specific repository
      const checkinSnapshotRepo = queryRunner.manager.getRepository(CheckinSnapshot);
      const checkinSnapshot = checkinSnapshotRepo.create({
        checkin: { id: checkinId } as Checkin,
        sequence: sequence,
        image: fileUpload,
      });

      const savedSnapshot = await queryRunner.manager.save(checkinSnapshot);
      await queryRunner.commitTransaction();
      return savedSnapshot;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
