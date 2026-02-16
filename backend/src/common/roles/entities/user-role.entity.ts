import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Role } from './role.entity';
import { User } from '@/common/base-user/entities/user.entity';

@Entity('user_roles')
@Index(['userId', 'roleId'], { unique: true })
export class UserRole extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID',
  })
  @Column({ type: 'varchar' })
  userId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Role ID',
  })
  @Column({ type: 'varchar' })
  roleId: string;

  // Relations
  @ManyToOne(() => User, (user) => user.roles)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;
}
