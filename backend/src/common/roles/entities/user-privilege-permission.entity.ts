import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { UserPrivilege } from './user-privilege.entity';
import { Permission } from './permission.entity';

@Entity('user_privilege_permissions')
@Index(['userPrivilegeId', 'permissionId'], { unique: true })
export class UserPrivilegePermission extends GeneralBaseEntity {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User Privilege ID',
  })
  @Column({ type: 'varchar' })
  userPrivilegeId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Permission ID',
  })
  @Column({ type: 'varchar' })
  permissionId: string;

  // Relations
  @ManyToOne(() => UserPrivilege, (userPrivilege) => userPrivilege.permissions)
  @JoinColumn({ name: 'userPrivilegeId' })
  userPrivilege: UserPrivilege;

  @ManyToOne(() => Permission)
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;
}
