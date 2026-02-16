import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BannerImage } from './banner-image.entity';
import { GeneralBaseEntity } from '@/common/entities';
import { EAdvertisementStatus } from '@shared/enums/advertisement.enum';

@Entity('advertisements')
export class Advertisement extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Summer Sale 2024',
    description: 'Advertisement title',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    enum: EAdvertisementStatus,
    example: EAdvertisementStatus.ACTIVE,
    description: 'Current status of the advertisement',
  })
  @Column({
    type: 'enum',
    enum: EAdvertisementStatus,
    default: EAdvertisementStatus.DRAFT,
  })
  status: EAdvertisementStatus;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Start date of the advertisement',
  })
  @Column({ type: 'timestamptz' })
  startDate: Date;

  @ApiProperty({
    example: '2024-12-31T23:59:59.000Z',
    description: 'End date of the advertisement',
  })
  @Column({ type: 'timestamptz' })
  endDate: Date;

  @ApiPropertyOptional({
    example: 'https://example.com/promotion',
    description: 'Website link for the advertisement',
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  websiteLink?: string;

  @ApiPropertyOptional({
    description: 'Banner image for the advertisement',
    type: () => BannerImage,
  })
  @ManyToOne(() => BannerImage, {
    nullable: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'bannerImageId' })
  bannerImage?: BannerImage | null;
}

