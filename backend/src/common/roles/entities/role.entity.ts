import {
  Entity,
  Column,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { RolePermission } from './role-permission.entity';

@Entity('roles')
export class Role extends GeneralBaseEntity {
  @ApiProperty({ example: 'Administrator', description: 'Role name' })
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @ApiProperty({ example: 'admin', description: 'Role code/slug' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiProperty({ example: 'Full system access', description: 'Role description' })
  @Column({ type: 'text', nullable: true })
  description: string;


  @ApiProperty({ example: true, description: 'Whether role is system defined' })
  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];
}
