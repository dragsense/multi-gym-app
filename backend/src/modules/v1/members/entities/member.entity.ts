import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';

@Entity('members')
export class Member extends GeneralBaseEntity {
  @ApiPropertyOptional({ example: 'Weight Loss', description: 'Client goal' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  goal?: string;

  @ApiPropertyOptional({ example: 'Beginner', description: 'Fitness level' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  fitnessLevel?: string;

  @ApiProperty({ example: 'No injuries', description: 'Medical conditions' })
  @Column({ type: 'text', nullable: true })
  medicalConditions?: string;

  @ApiProperty({ type: () => User, description: 'Associated user' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn()
  user: User;

  @ApiPropertyOptional({
    type: () => User,
    description: 'User who created this client record',
    required: false,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User;
}
