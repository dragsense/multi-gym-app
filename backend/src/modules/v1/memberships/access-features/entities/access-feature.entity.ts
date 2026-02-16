import {
  Entity,
  Column,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('access_features')
export class AccessFeature extends GeneralBaseEntity {
  @ApiProperty({ example: 'Gym Access', description: 'Access feature name' })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    example: 'Full access to gym facilities',
    description: 'Access feature description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;
}

