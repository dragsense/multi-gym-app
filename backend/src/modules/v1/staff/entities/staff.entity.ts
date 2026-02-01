import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity('staff')
export class Staff extends GeneralBaseEntity {
  @ApiProperty({ type: () => User, description: 'Associated user' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;

  @ApiPropertyOptional({
    example: 'Fitness Trainer',
    description: 'Specialization',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  specialization?: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Years of experience',
  })
  @Column({ type: 'int', nullable: true })
  experience?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this staff member is a trainer',
  })
  @Column({ type: 'boolean', default: false })
  isTrainer?: boolean;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this staff record',
    required: false,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Location ID associated with this staff member',
  })
  @Column({ type: 'uuid', nullable: true })
  locationId?: string;

  @ApiPropertyOptional({
    type: () => Location,
    description: 'Location associated with this staff member',
  })
  @ManyToOne(() => Location, (location) => location.staff, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locationId' })
  location?: Location;
}
