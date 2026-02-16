import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';
import { GeneralBaseEntity } from '@/common/entities';
import { Checkin } from './checkin.entity';

@Entity('checkin_snapshots')
export class CheckinSnapshot extends GeneralBaseEntity {
  @ApiProperty({
    example: 1,
    description: 'Sequence number of the snapshot (1, 2, or 3)',
  })
  @Column({ type: 'int' })
  sequence: number;

  @ApiProperty({
    type: () => Checkin,
    description: 'Checkin this snapshot belongs to',
  })
  @ManyToOne(() => Checkin, (checkin) => checkin.snapshots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'checkinId' })
  checkin: Checkin;

  @ApiPropertyOptional({
    description: 'File entity for the uploaded snapshot image',
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

