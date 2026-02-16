import {
  Entity,
  Column,
  BeforeUpdate,
  BeforeInsert,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { GeneralBaseEntity } from '@/common/entities';
import { UserRole } from '@/common/roles/entities/user-role.entity';
import { UserPermission } from '@/common/roles/entities/user-permission.entity';
import { UserPrivilege } from '@/common/roles/entities/user-privilege.entity';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User extends GeneralBaseEntity {
  @ApiProperty({
    example: 'email@example.com',
    description: "user's email address",
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({ example: 'John', description: 'First name of the user' })
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the user' })
  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @ApiPropertyOptional({ example: '1990-01-01', description: 'Date of birth' })
  @Column({ type: 'date', nullable: true })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 'male',
    description: 'User gender',
  })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  gender?: string;

  @Exclude()
  @ApiProperty({ example: 'secrete', description: "user's password" })
  @Column({ type: 'varchar', length: 100, select: false })
  password: string;

  @ApiPropertyOptional({ example: true, description: 'User active status' })
  @Column({ type: 'boolean', default: true })
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, description: 'User verified status' })
  @Column({ type: 'boolean', default: false })
  isVerified?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'User level',
  })
  @Column({ type: 'int', nullable: false })
  level: number;

  @Column({ type: 'timestamp', nullable: true })
  lastPasswordChange: Date;

  @Column('text', { array: true, default: [], select: false })
  passwordHistory: string[];


  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Reference user ID - ID of the user who activated the business subscription',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true, select: false })
  refUserId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this user is the platform owner',
    required: false,
  })
  @Column({ type: 'boolean', default: false })
  isPlatformOwner?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether user has administrative privileges',
    required: false,
  })
  @Column({ type: 'boolean', default: false, nullable: true })
  isAdministrative?: boolean;

  // Relations
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  roles: UserRole[];

  @OneToMany(() => UserPermission, (userPermission) => userPermission.user)
  permissions: UserPermission[];

  @OneToMany(() => UserPrivilege, (userPrivilege) => userPrivilege.user)
  privileges: UserPrivilege[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
      this.lastPasswordChange = new Date();
      this.passwordHistory = [
        this.password,
        ...(this.passwordHistory || []),
      ].slice(0, 5); // Keep last 5 passwords
    }
  }
}
