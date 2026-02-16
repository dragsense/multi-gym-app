import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Member } from '@/modules/v1/members/entities/member.entity';

@Entity('member_notes')
export class MemberNote extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Member ID',
  })
  @Column({ type: 'uuid' })
  memberId: string;

  @ApiProperty({ type: () => Member, description: 'Associated member' })
  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @ApiPropertyOptional({
    example: 'General information about the member',
    description: 'General information about the member',
  })
  @Column({ type: 'text', nullable: true })
  generalInfo?: string;

  @ApiPropertyOptional({
    example: 'Medical conditions and history',
    description: 'Medical conditions and history',
  })
  @Column({ type: 'text', nullable: true })
  medicalConditions?: string;

  @ApiPropertyOptional({
    example: ['Peanuts', 'Dairy', 'Shellfish'],
    description: 'List of allergies',
    type: [String],
  })
  @Column({ type: 'jsonb', nullable: true, default: [] })
  allergies?: string[];

  @ApiPropertyOptional({
    example: 'Dr. John Smith',
    description: 'Physician name',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  physicianName?: string;

  @ApiPropertyOptional({
    example: ['Aspirin', 'Metformin'],
    description: 'List of medications',
    type: [String],
  })
  @Column({ type: 'jsonb', nullable: true, default: [] })
  medications?: string[];
}

