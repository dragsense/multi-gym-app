import { Injectable } from '@nestjs/common';
import { EPermissionAction } from '@shared/enums';
import { EntityRouterService } from '@/common/database/entity-router.service';

export interface ResourcePermissionContext {
  resourceId: number;
  resourceRoles: string[];
  permissions: string[];
  columnPermissions: Record<string, any>;
}

@Injectable()
export class PermissionService {
  constructor(private readonly entityRouterService: EntityRouterService) {}

  /**
   * Set the entity for this service instance
   */
  setEntity(entity: any) {
    this.entity = entity;
  }

  private entity: any;

  /**
   * Get entity's complete permission context
   */
  async getEntityPermissionContext(
    entityId: number,
  ): Promise<ResourcePermissionContext> {
    if (!this.entity) {
      throw new Error('Entity not set. Call setEntity() first.');
    }

    // Get the repository for the entity
    const entityRepository = this.entityRouterService.getRepository(this.entity);

    // Get the actual entity from database with its relationships
    const entity = await entityRepository.findOne({
      where: { id: entityId },
      relations: ['roles.role', 'permissions.permission', 'privileges.permissions.permission'],
    });

    if (!entity) {
      throw new Error(`Entity with ID ${entityId} not found`);
    }


    // Get roles and permissions from entity's database relationships
    const roles = await this.getEntityRolesFromDatabase(entity);
    const permissions = await this.getEntityPermissionsFromDatabase(entity);
    const columnPermissions =
      await this.getEntityColumnPermissionsFromDatabase(entity);

    return {
      resourceId: entityId,
      resourceRoles: roles,
      permissions,
      columnPermissions,
    };
  }

  /**
   * Get roles from entity's database relationships
   */
  private async getEntityRolesFromDatabase(entity: any): Promise<string[]> {
    const roles: string[] = [];

    // Get roles directly from entity
    if (entity.roles) {
      for (const entityRole of entity.roles) {
        if (!roles.includes(entityRole.role.name)) {
          roles.push(entityRole.role.name);
        }
      }
    }

    return roles;
  }

  /**
   * Get permissions from entity's database relationships
   */
  private async getEntityPermissionsFromDatabase(
    entity: any,
  ): Promise<string[]> {
    const permissions: string[] = [];

    // Get direct permissions from entity
    if (entity.permissions) {
      for (const entityPermission  of entity.permissions) {
        const permissionString = `${entityPermission.permission.name}`;
        if (!permissions.includes(permissionString)) {
          permissions.push(permissionString);
        }
      }
    }

    if(entity.privileges) {
      for (const entityPrivilege of entity.privileges) {
        for (const entityPrivilegePermission of entityPrivilege.permissions) {
          const permissionString = `${entityPrivilegePermission.permission.name}`;
          if (!permissions.includes(permissionString)) {
            permissions.push(permissionString);
          }
        }
      }
    }

    return permissions;
  }

  /**
   * Get column permissions from entity's database relationships
   */
  private async getEntityColumnPermissionsFromDatabase(
    entity: any,
  ): Promise<Record<string, any>> {
    const columnPermissions: Record<string, any> = {};

    if (entity.permissions) {
      for (const entityPermission of entity.permissions) {
        const permission = entityPermission.permission;
        if (permission.includedColumns || permission.excludedColumns) {
          columnPermissions[entity.constructor.name] = {
            included: permission.includedColumns,
            excluded: permission.excludedColumns,
          };
        }
      }
    }

    return columnPermissions;
  }

  /**
   * Check if entity has permission for resource and action
   */
  async hasPermission(
    entityId: number,
    resourceName: string,
    action: EPermissionAction[],
  ): Promise<boolean> {
    const context = await this.getEntityPermissionContext(entityId);
    const permissionStrings = action.map(a => `${resourceName}:${a}`).join(',');

    // Check direct permissions
    if (context.permissions.some(name => permissionStrings.includes(name))) {
      return true;
    }

    // Check wildcard permissions
    if (
      context.permissions.includes(`${resourceName}:*`) ||
      context.permissions.some(name => name.startsWith(`*:${action}`)) ||
      context.permissions.includes('*:*')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Check if resource can access specific columns
   */
  async canAccessColumns(
    entityId: number,
    resourceName: string,
    columns: string[],
    action: 'read' | 'write' = 'read',
  ): Promise<{ allowed: string[]; denied: string[] }> {
    const context = await this.getEntityPermissionContext(entityId);
    const allowed: string[] = [];
    const denied: string[] = [];

    for (const column of columns) {
      const canAccess = await this.canAccessColumn(
        entityId,
        resourceName,
        column,
        action,
      );
      if (canAccess) {
        allowed.push(column);
      } else {
        denied.push(column);
      }
    }

    return { allowed, denied };
  }

  /**
   * Check if resource can access a specific column
   */
  async canAccessColumn(
    entityId: number,
    resourceName: string,
    columnName: string,
    action: 'read' | 'write' = 'read',
  ): Promise<boolean> {
    const context = await this.getEntityPermissionContext(entityId);

    // Get column permissions for this resource
    const resourcePermissions = context.columnPermissions[resourceName] || {};
    const columnPermission = resourcePermissions[columnName];

    if (!columnPermission) {
      return true; // No specific permission means access is allowed
    }

    // Check column-level permissions
    switch (columnPermission.type) {
      case 'hidden':
        return false;
      case 'read':
        return action === 'read';
      case 'write':
        return true;
      case 'required':
        return action === 'write';
      case 'optional':
        return true;
      default:
        return true;
    }
  }

  /**
   * Filter data based on column permissions
   */
  async filterDataByColumnPermissions<T extends Record<string, any>>(
    entityId: number,
    resourceName: string,
    data: T,
    action: 'read' | 'write' = 'read',
  ): Promise<Partial<T>> {
    const filteredData: Partial<T> = {};

    for (const [key, value] of Object.entries(data)) {
      const canAccess = await this.canAccessColumn(
        entityId,
        resourceName,
        key,
        action,
      );
      if (canAccess) {
        filteredData[key as keyof T] = value;
      }
    }

    return filteredData;
  }

  /**
   * Get resource's roles
   */
  async getResourceRoles(entityId: number): Promise<string[]> {
    const context = await this.getEntityPermissionContext(entityId);
    return context.resourceRoles;
  }

  /**
   * Get resource's permissions
   */
  async getResourcePermissions(entityId: number): Promise<string[]> {
    const context = await this.getEntityPermissionContext(entityId);
    return context.permissions;
  }

  /**
   * Check if resource has any of the specified permissions
   */
  async hasAnyPermission(
    entityId: number,
    permissions: string[],
  ): Promise<boolean> {
    const resourcePermissions = await this.getResourcePermissions(entityId);

    return permissions.some((permission) => {
      if (resourcePermissions.includes(permission)) {
        return true;
      }

      // Check wildcard permissions
      const [resource, action] = permission.split(':');
      if (
        resourcePermissions.includes(`${resource}:*`) ||
        resourcePermissions.includes(`*:${action}`) ||
        resourcePermissions.includes('*:*')
      ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Check if resource has all of the specified permissions
   */
  async hasAllPermissions(
    entityId: number,
    permissions: string[],
  ): Promise<boolean> {
    const resourcePermissions = await this.getResourcePermissions(entityId);

    return permissions.every((permission) => {
      if (resourcePermissions.includes(permission)) {
        return true;
      }

      // Check wildcard permissions
      const [resource, action] = permission.split(':');
      if (
        resourcePermissions.includes(`${resource}:*`) ||
        resourcePermissions.includes(`*:${action}`) ||
        resourcePermissions.includes('*:*')
      ) {
        return true;
      }

      return false;
    });
  }
}
