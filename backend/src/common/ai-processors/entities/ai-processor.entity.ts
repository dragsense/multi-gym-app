import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EAIProcessorType } from '@shared/enums/ai-processors.enum';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('ai_processors')
export class AIProcessor extends GeneralBaseEntity {
  @ApiProperty({ example: 'openai', description: 'AI processor type' })
  @Column({
    type: 'enum',
    enum: EAIProcessorType,
    unique: true,
  })
  type: EAIProcessorType;

  @ApiProperty({ example: true, description: 'Is this AI processor enabled?' })
  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @ApiPropertyOptional({
    example: 'OpenAI GPT models',
    description: 'Description or notes',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;
}
