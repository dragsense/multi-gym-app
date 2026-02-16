import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { User } from '@/common/base-user/entities/user.entity';
import { UserPrivilegePermission } from './user-privilege-permission.entity';

@Entity('user_privileges')
@Index(['userId'], { unique: false })
export class UserPrivilege extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID',
  })
  @Column({ type: 'varchar' })
  userId: string;

  // Relations
  @ManyToOne(() => User, (user) => user.privileges)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => UserPrivilegePermission, (userPrivilegePermission) => userPrivilegePermission.userPrivilege)
  permissions: UserPrivilegePermission[];
}
