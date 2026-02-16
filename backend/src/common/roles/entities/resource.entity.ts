import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { Permission } from './permission.entity';

@Entity('resources')
export class Resource extends GeneralBaseEntity {
  @ApiProperty({ example: 'users', description: 'Resource name (table name)' })
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;
  
  @ApiProperty({
    example: 'User Management',
    description: 'Resource display name',
  })
  @Column({ type: 'varchar', length: 100 })
  displayName: string;

  @ApiProperty({
    example: 'User entity for authentication and authorization',
    description: 'Resource description',
  })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ example: true, description: 'Whether resource is active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Permission, (permission) => permission.resource)
  permissions: Permission[];
}
