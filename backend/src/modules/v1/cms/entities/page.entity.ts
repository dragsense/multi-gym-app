import { Entity, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('pages')
@Index(['slug'], { unique: true })
export class Page extends GeneralBaseEntity {
  @ApiProperty({
    example: 'Terms and Conditions',
    description: 'Page title',
  })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({
    example: 'terms-and-conditions',
    description: 'Page slug (unique)',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @ApiProperty({
    description: 'PUCK editor data (JSON)',
  })
  @Column({ type: 'jsonb' })
  content: any;

  @ApiPropertyOptional({
    example: 'Terms and conditions page',
    description: 'Page description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the page is published',
  })
  @Column({ type: 'boolean', default: false })
  isPublished?: boolean;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Publication date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is a system page (cannot be deleted or have slug changed)',
  })
  @Column({ type: 'boolean', default: false })
  isSystem?: boolean;
}
