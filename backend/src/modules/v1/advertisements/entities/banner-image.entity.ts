import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('banner_images')
export class BannerImage extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Summer Sale Banner',
    description: 'Banner image name',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiPropertyOptional({
    description: 'File entity for the uploaded banner image',
    type: () => FileUpload,
  })
  @ManyToOne(() => FileUpload, {
    cascade: true,
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'imageId' })
  image?: FileUpload | null;
}

