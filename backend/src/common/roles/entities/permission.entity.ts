import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Resource } from './resource.entity';
import { RolePermission } from './role-permission.entity';
import { UserPermission } from './user-permission.entity';
import { UserPrivilegePermission } from './user-privilege-permission.entity';
import { EPermissionAction } from '@shared/enums';

@Entity('permissions')
export class Permission extends GeneralBaseEntity {
  @ApiProperty({ example: 'user:create', description: 'Permission name/code' })
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @ApiProperty({
    example: 'Create User',
    description: 'Permission display name',
  })
  @Column({ type: 'varchar', length: 100 })
  displayName: string;

  @ApiProperty({
    example: 'Allow creating new users',
    description: 'Permission description',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    enum: EPermissionAction,
    example: EPermissionAction.CREATE,
    description: 'Permission action',
  })
  @Column({
    type: 'enum',
    enum: EPermissionAction,
  })
  action: EPermissionAction;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Resource ID',
  })
  @Column({ type: 'varchar' })
  resourceId: string;

  @ApiProperty({
    example: true,
    description: 'Whether permission is system defined',
  })
  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @ApiPropertyOptional({
    example: ['email', 'name'],
    description: 'Included columns (if empty, all columns are accessible)',
  })
  @Column({ type: 'jsonb', nullable: true })
  includedColumns?: string[];

  @ApiPropertyOptional({
    example: ['password', 'ssn'],
    description: 'Excluded columns',
  })
  @Column({ type: 'jsonb', nullable: true })
  excludedColumns?: string[];

  @ManyToOne(() => Resource, (resource) => resource.permissions)
  @JoinColumn({ name: 'resourceId' })
  resource: Resource;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];

  @OneToMany(() => UserPrivilegePermission, (userPrivilegePermission) => userPrivilegePermission.permission)
  userPrivilegePermissions: UserPrivilegePermission[];

}
