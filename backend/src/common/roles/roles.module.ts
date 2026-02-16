import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { ResourceSeed } from './seeder/resource.seed';
import { PermissionSeed } from './seeder/permission.seed';
import { Resource } from './entities/resource.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';
import { UserPermission } from './entities/user-permission.entity';
import { UserPrivilege } from './entities/user-privilege.entity';
import { UserPrivilegePermission } from './entities/user-privilege-permission.entity';
import { PermissionsService } from './services/permissions.service';
import { ResourcesService } from './services/resources.service';
import { PermissionService } from './services/permission.service';
import { CrudModule } from '../crud/crud.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resource, Role, Permission, RolePermission, UserRole, UserPermission, UserPrivilege, UserPrivilegePermission]),
    CrudModule,
  ],
  controllers: [RolesController],
  providers: [
    RolesService,
    PermissionsService,
    ResourcesService,
    PermissionService,
    ResourceSeed,
    PermissionSeed,
  ],
  exports: [
    RolesService,
    PermissionsService,
    ResourcesService,
    PermissionService,
    ResourceSeed,
    PermissionSeed,
  ],
})
export class RolesModule {}
