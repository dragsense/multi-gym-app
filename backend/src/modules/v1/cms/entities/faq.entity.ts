import { Entity, Column } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';

@Entity('faqs')
export class Faq extends GeneralBaseEntity {
  @ApiProperty({
    example: 'What is your return policy?',
    description: 'FAQ question',
  })
  @Column({ type: 'text' })
  question: string;

  @ApiProperty({
    example: 'We offer a 30-day return policy on all products.',
    description: 'FAQ answer',
  })
  @Column({ type: 'text' })
  answer: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the FAQ is enabled',
  })
  @Column({ type: 'boolean', default: true })
  enabled?: boolean;
}
