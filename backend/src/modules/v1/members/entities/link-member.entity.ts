import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Member } from './member.entity';

@Entity('link_members')
@Index(['primaryMemberId', 'linkedMemberId'], { unique: true })
export class LinkMember extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Primary member ID',
  })
  @Column({ type: 'uuid' })
  primaryMemberId: string;

  @ApiProperty({
    type: () => Member,
    description: 'Primary member',
  })
  @ManyToOne(() => Member, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'primaryMemberId' })
  primaryMember: Member;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Linked member ID',
  })
  @Column({ type: 'uuid' })
  linkedMemberId: string;

  @ApiProperty({
    type: () => Member,
    description: 'Linked member',
  })
  @ManyToOne(() => Member, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'linkedMemberId' })
  linkedMember: Member;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to view session check for this link',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  viewSessionCheck: boolean;

  @ApiPropertyOptional({
    example: 'Family member link',
    description: 'Notes or description about the link',
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;
}
