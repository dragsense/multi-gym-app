// src/modules/file-upload/entities/uploaded-file.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EFileType } from '@shared/enums';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('uploaded_files')
export class FileUpload extends GeneralBaseEntity {

  @ApiProperty({
    example: 'banner.jpg',
    description: 'Original file name as uploaded by the user',
  })
  @Column()
  name: string;

  @ApiProperty({
    example: 'banner.jpg',
    description: 'Original file name as uploaded by the user',
  })
  @Column()
  originalName: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type of the uploaded file (e.g. image/jpeg, image/png)',
  })
  @Column({ default: '' })
  mimeType: string;


  @ApiProperty({
    example: EFileType.IMAGE,
    description: 'Type of the uploaded file (e.g. image, video, audio)',
  })
  @Column({ type: 'enum', enum: EFileType, default: EFileType.OTHER })
  type: EFileType;

  @ApiProperty({
    example: 1048576,
    description: 'Size of the file in bytes',
  })
  @Column({ type: 'bigint', default: 0 })
  size: number;

  @ApiProperty({
    example: 'uploads/banner-image/1722104000000-banner.jpg',
    description: 'Relative path to the uploaded file on the server',
  })
  @Column({ nullable: true })
  path: string;

  @ApiProperty({
    example: 'general',
    description: 'Folder where file is uploaded',
  })
  @Column({ default: 'general' })
  folder: string;

  @ApiProperty({
    example: 'http://localhost:3001/uploads/banner-image/1722104000000-banner.jpg',
    description: 'Full URL to access the file',
  })
  @Column()
  url: string;
}
