import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { CrudService } from '@/common/crud/crud.service';
import { CreateRoleDto, UpdateRoleDto } from '@shared/dtos/role-dtos';
import { PermissionsService } from './services/permissions.service';
import { IMessageResponse } from '@shared/interfaces';

@Injectable()
export class RolesService extends CrudService<Role> {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly permissionsService: PermissionsService,
    moduleRef: ModuleRef,
  ) {
    super(roleRepository, moduleRef, {
      searchableFields: ['name', 'code'],
    });
  }

  /**
   * Create role with permissions validation in multi-tenant context
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const { rolePermissions: dtoRolePermissions, ...roleData } = createRoleDto;

    // Extract permission IDs from DTO
    const permissionIds = dtoRolePermissions
      ?.map((p) => p.id)
      .filter((id) => id) || [];

    // Get tenant-specific repositories
    const roleRepo = this.getRepository();
    const dataSource = roleRepo.manager.connection;
    const rolePermissionRepo = dataSource.getRepository(RolePermission);

    const permissionRepo = this.permissionsService.getRepository();


    // Validate permissions exist in tenant database
    if (permissionIds.length > 0) {
      const permissions = await permissionRepo.find({
        where: permissionIds.map((id) => ({ id })),
      });

      if (permissions.length !== permissionIds.length) {
        const foundIds = permissions.map((p) => p.id);
        const missingIds = permissionIds.filter((id) => !foundIds.includes(id));
        throw new BadRequestException(
          `Permissions not found in database: ${missingIds.join(', ')}`,
        );
      }
    }

    // Create role first
    const role = roleRepo.create(roleData);
    const savedRole = await roleRepo.save(role);

    // Create role_permission entries
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map((permissionId) =>
        rolePermissionRepo.create({
          roleId: savedRole.id,
          permissionId,
        }),
      );
      await rolePermissionRepo.save(rolePermissions);
    }

    // Load role with permissions for response
    return savedRole;
  }

  /**
   * Update role with permissions validation in multi-tenant context
   */
  async updateRole(
    id: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<IMessageResponse> {
    // Get tenant-specific repositories
    const roleRepo = this.getRepository();
    const dataSource = roleRepo.manager.connection;
    const rolePermissionRepo = dataSource.getRepository(RolePermission);

    const permissionRepo = this.permissionsService.getRepository();

    // Update role fields (excluding permissions)
    const { rolePermissions: dtoRolePermissions, ...roleData } = updateRoleDto;
    await this.update(id, roleData as any);

    // Handle permissions if provided
    if (dtoRolePermissions !== undefined) {
      const permissionIds = dtoRolePermissions
        .map((p) => p.id)
        .filter((id) => id);

      // Validate permissions exist in tenant database
      if (permissionIds.length > 0) {
        const permissions = await permissionRepo.find({
          where: permissionIds.map((id) => ({ id })),
        });

        if (permissions.length !== permissionIds.length) {
          const foundIds = permissions.map((p) => p.id);
          const missingIds = permissionIds.filter((id) => !foundIds.includes(id));
          throw new BadRequestException(
            `Permissions not found in database: ${missingIds.join(', ')}`,
          );
        }
      }

      // Remove existing role_permissions
      await rolePermissionRepo.delete({ roleId: id });

      // Create new role_permission entries
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId) =>
          rolePermissionRepo.create({
            roleId: id,
            permissionId,
          }),
        );
        await rolePermissionRepo.save(rolePermissions);
      }
    }

    // Load role with permissions for response
    return { message: 'Role updated successfully' };
  }
}
