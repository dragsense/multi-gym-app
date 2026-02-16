import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { FileUpload } from './entities/file-upload.entity';
import {
  FileListDto,
  CreateFileUploadDto,
  UpdateFileUploadDto,
} from '@shared/dtos/file-upload-dtos/file-upload.dto';
import { IPaginatedResponse } from '@shared/interfaces';
import { ConfigService } from '@nestjs/config';
import { detectFileType } from '@/lib/utils/detect-file-type.util';
import { OmitType } from '@shared/lib/type-utils';
import { CrudService } from '@/common/crud/crud.service';

@Injectable()
export class FileUploadService extends CrudService<FileUpload> {
  private readonly appUrl: string;

  constructor(
    @InjectRepository(FileUpload)
    private fileRepo: Repository<FileUpload>,
    private configService: ConfigService,
    moduleRef: ModuleRef,
  ) {
    super(fileRepo, moduleRef);
    this.appUrl =
      this.configService.get<string>('app.url') || 'http://localhost:3000';
  }
  private ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Create file: If file is provided, upload it (ignore URL). Otherwise, use URL.
   * Auto-corrects type based on file mimetype
   */
  async createFile(
    createDto: OmitType<CreateFileUploadDto, 'file'>,
    file?: Express.Multer.File,
    saveFile: boolean = true,
    manager?: EntityManager,
  ): Promise<FileUpload> {
    const folder = createDto.folder || 'general';

    // If physical file is provided, upload it (ignore URL)
    if (file) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
      this.ensureDirectoryExists(uploadDir);

      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const fileName = `${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      if (saveFile) {
        const physicalPath = path.join(uploadDir, fileName);
        fs.writeFileSync(physicalPath, file.buffer);
      }

      const relativePath = `uploads/${folder}/${fileName}`;
      const url = `${this.appUrl}/${relativePath}`;

      // Auto-detect and correct type from mimetype
      const detectedType = detectFileType(file.mimetype);

      const fileData = {
        name: createDto.name || file.originalname,
        originalName: file.originalname,
        type: detectedType, // Use detected type, ignore user-provided type
        mimeType: file.mimetype,
        size: file.size,
        path: relativePath,
        folder: folder,
        url,
      };

      const repository = this.getRepository();
      return manager
        ? await manager.save(repository.create(fileData))
        : await this.create(fileData);
    }

    // If no file but URL is provided
    if (createDto.url) {
      const fileData = {
        name: createDto.name,
        type: createDto.type,
        path: createDto.url,
        folder: folder,
        url: createDto.url,
      };

      const repository = this.getRepository();
      return manager
        ? await manager.save(repository.create(fileData))
        : await this.create(fileData);
    }

    throw new NotFoundException('Either file or url must be provided');
  }

  /**
   * Delete physical file from disk and DB record
   */
  async deleteFile(file: FileUpload): Promise<void> {
    // Delete physical file
    const filePath = path.join(process.cwd(), 'public', file.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete DB record
    await this.delete(file.id);
  }

  /**
   * Update file: If file is provided, delete old and upload new (ignore URL). Otherwise, update metadata only.
   * Auto-corrects type based on file mimetype if file is provided
   */
  async updateFile(
    id: string,
    updateData: OmitType<UpdateFileUploadDto, 'file'>,
    file?: Express.Multer.File,
    saveFile: boolean = true,
    manager?: EntityManager,
  ): Promise<FileUpload> {
    const existingFile = await this.getSingle(id);

    if (!existingFile) throw new NotFoundException('File not found');

    // If physical file is provided, delete old and upload new (ignore URL)
    if (file) {
      // Delete old physical file
      const oldFilePath = path.join(process.cwd(), 'public', existingFile.path);
      if (fs.existsSync(oldFilePath) && saveFile) {
        fs.unlinkSync(oldFilePath);
      }

      // Upload new file
      const uploadFolder = updateData.folder || existingFile.folder;
      const uploadDir = path.join(
        process.cwd(),
        'public',
        'uploads',
        uploadFolder,
      );
      this.ensureDirectoryExists(uploadDir);

      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const fileName = `${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const physicalPath = path.join(uploadDir, fileName);
      if (saveFile) {
        fs.writeFileSync(physicalPath, file.buffer);
      }

      const relativePath = `uploads/${uploadFolder}/${fileName}`;
      const url = `${this.appUrl}/${relativePath}`;

      // Auto-detect and correct type from mimetype
      const detectedType = detectFileType(file.mimetype);

      existingFile.name = updateData.name || file.originalname;
      existingFile.type = detectedType; // Use detected type, ignore user-provided
      existingFile.mimeType = file.mimetype;
      existingFile.size = file.size;
      existingFile.path = relativePath;
      existingFile.folder = uploadFolder;
      existingFile.url = url;
    } else {
      // Just update metadata (no file upload)
      if (updateData.name) existingFile.name = updateData.name;
      if (updateData.type) existingFile.type = updateData.type;
    }

    return manager
      ? await manager.save(existingFile)
      : await this.update(id, existingFile);
  }

  async saveFiles(
    fileUploads: { file: Express.Multer.File; fileUpload: FileUpload }[],
  ): Promise<void> {
    for (let i = 0; i < fileUploads.length; i++) {
      if (!fileUploads[i].file) {
        throw new BadRequestException('File not found');
      }

      const uploadDir = path.join(process.cwd(), 'public');
      this.ensureDirectoryExists(uploadDir);

      const physicalPath = path.join(uploadDir, fileUploads[i].fileUpload.path);
      fs.writeFileSync(physicalPath, fileUploads[i].file.buffer);
    }
  }

  async deleteFiles(fileUploads: FileUpload[]): Promise<void> {
    for (let i = 0; i < fileUploads.length; i++) {
      await this.deleteFile(fileUploads[i]);
    }
  }
}
