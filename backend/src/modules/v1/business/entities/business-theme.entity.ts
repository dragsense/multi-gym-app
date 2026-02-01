import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Business } from './business.entity';
import { FileUpload } from '@/common/file-upload/entities/file-upload.entity';

@Entity('business_themes')
@Index(['businessId'], { unique: true })
export class BusinessTheme extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Business ID',
  })
  @Column({ type: 'uuid' })
  businessId: string;

  @ApiProperty({
    type: () => Business,
    description: 'Associated business',
  })
  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  // Logo - File Upload Relations
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Logo file ID for light theme',
  })
  @Column({ type: 'uuid', nullable: true })
  logoLightId?: string;

  @ApiPropertyOptional({
    type: () => FileUpload,
    description: 'Logo file for light theme',
  })
  @ManyToOne(() => FileUpload, {
    cascade: true,
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'logoLightId' })
  logoLight?: FileUpload | null;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Logo file ID for dark theme',
  })
  @Column({ type: 'uuid', nullable: true })
  logoDarkId?: string;

  @ApiPropertyOptional({
    type: () => FileUpload,
    description: 'Logo file for dark theme',
  })
  @ManyToOne(() => FileUpload, {
    cascade: true,
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'logoDarkId' })
  logoDark?: FileUpload | null;

  // Favicon - File Upload Relation
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Favicon file ID',
  })
  @Column({ type: 'uuid', nullable: true })
  faviconId?: string;

  @ApiPropertyOptional({
    type: () => FileUpload,
    description: 'Favicon file',
  })
  @ManyToOne(() => FileUpload, {
    cascade: true,
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'faviconId' })
  favicon?: FileUpload | null;

  // Primary Colors
  @ApiPropertyOptional({
    example: '#3b82f6',
    description: 'Primary color for light theme',
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  primaryColorLight?: string;

  @ApiPropertyOptional({
    example: '#60a5fa',
    description: 'Primary color for dark theme',
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  primaryColorDark?: string;

  // Font
  @ApiPropertyOptional({
    example: 'Poppins',
    description: 'Font family name',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  fontFamily?: string;

  @ApiPropertyOptional({
    example: 'https://fonts.googleapis.com/css2?family=Poppins:...',
    description: 'Font URL',
  })
  @Column({ type: 'varchar', length: 500, nullable: true })
  fontUrl?: string;

  // Title
  @ApiPropertyOptional({
    example: 'My Business',
    description: 'Business title/brand name',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  title?: string;
}
