import { Entity, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { ESettingType } from '@shared/enums/setting.enum';

@Entity('settings')
@Index(['entityId', 'key'], { unique: true })
export class Setting extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID',
  })
  @Column({ type: 'varchar' })
  entityId: string;

  @ApiProperty({ example: 'theme', description: 'Setting key' })
  @Column({ type: 'varchar', length: 100 })
  key: string;

  @ApiProperty({ example: 'dark', description: 'Setting value' })
  @Column({ type: 'text' })
  value: string;

  @ApiProperty({
    example: 'STRING',
    description: 'Setting value type',
    enum: ESettingType,
  })
  @Column({ type: 'enum', enum: ESettingType, default: ESettingType.STRING })
  type: ESettingType;

  @ApiPropertyOptional({
    example: 'User theme preference',
    description: 'Setting description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether setting is public/visible to others',
  })
  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether setting can be modified by user',
  })
  @Column({ type: 'boolean', default: true })
  isEditable: boolean;
}
