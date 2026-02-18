import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '@/common/roles/services/permission.service';
import {
  RESOURCE_KEY,
  ACTION_KEY,
  PERMISSION_KEY,
  ROLES_KEY,
  SKIP_PERMISSIONS_KEY,
} from '@/decorators';
import { EPermissionAction, EUserLevels } from '@shared/enums';
import { IS_PUBLIC_KEY } from '@/decorators/access.decorator';
import { User } from '@/common/base-user/entities/user.entity';

@Injectable()
export class UerPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {
    // Set the User entity for PermissionService since this guard always works with User entities
    this.permissionService.setEntity(User);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const resource = request.user;

    if (resource.level <= EUserLevels.ADMIN) {
      return true;
    }

    if (!resource) {
      throw new ForbiddenException('Resource not authenticated');
    }


    // Check if permissions should be skipped
    const skipPermissions = this.reflector.getAllAndOverride<boolean>(
      SKIP_PERMISSIONS_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ]);

    if (skipPermissions) {
      return true;
    }

    // Get permission requirements from decorators
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get resource and action from decorators (for backward compatibility)
    const resourceName = this.reflector.getAllAndOverride<string>(
      RESOURCE_KEY,
      [context.getHandler(),
      context.getClass()
      ]
    );


    const action = this.reflector.get<EPermissionAction>(
      ACTION_KEY,
      context.getHandler(),
    );


    // If no permission requirements are specified, allow access
    if (!requiredPermissions && !requiredRoles && !resourceName) {
      return true;
    }


    // Check role-based permissions
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = await this.checkRoles(resource.id, requiredRoles);
      if (!hasRole) {
        throw new ForbiddenException(
          `Insufficient roles. Required: ${requiredRoles.join(', ')}.`,
        );
      }
    }

    // Check permission-based access
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = await this.checkPermissions(
        resource.id,
        requiredPermissions,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}.`,
        );
      }

      return true;
    }

    // Check legacy resource/action permissions (for backward compatibility)
    if (resourceName) {
      // Use action from decorator or determine from HTTP method
      const finalAction = action || this.getActionFromMethod(request.method);

      const hasPermission = await this.permissionService.hasPermission(
        resource.id,
        resourceName,
        [finalAction, EPermissionAction.MANAGE],
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${resourceName}:${finalAction}.`,
        );
      }

      // Check column-level permissions if this is a data access operation
      if (
        finalAction === EPermissionAction.READ ||
        finalAction === EPermissionAction.UPDATE
      ) {
        await this.checkColumnPermissions(
          request,
          resource.id,
          resourceName,
          finalAction,
        );
      }
    }

    return true;
  }

  /**
   * Check if user has required roles
   */
  private async checkRoles(
    userId: number,
    requiredRoles: string[],
  ): Promise<boolean> {
    const userRoles = await this.permissionService.getResourceRoles(userId);
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  /**
   * Check if user has required permissions
   */
  private async checkPermissions(
    userId: number,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const userPermissions =
      await this.permissionService.getResourcePermissions(userId);
    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );
  }

  /**
   * Get action from HTTP method
   */
  private getActionFromMethod(method: string): EPermissionAction {
    switch (method.toUpperCase()) {
      case 'GET':
        return EPermissionAction.READ;
      case 'POST':
        return EPermissionAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return EPermissionAction.UPDATE;
      case 'DELETE':
        return EPermissionAction.DELETE;
      default:
        return EPermissionAction.READ;
    }
  }

  /**
   * Check column-level permissions for data access
   */
  private async checkColumnPermissions(
    request: any,
    resourceId: number,
    resourceName: string,
    action: EPermissionAction,
  ): Promise<void> {
    // Get request body/query parameters to check column access
    const requestData = request.body || request.query || {};
    const columns = Object.keys(requestData);

    if (columns.length > 0) {
      const columnAccess = await this.permissionService.canAccessColumns(
        resourceId,
        resourceName,
        columns,
        action === EPermissionAction.READ ? 'read' : 'write',
      );

      if (columnAccess.denied.length > 0) {
        throw new ForbiddenException(
          `Access denied to columns: [${columnAccess.denied.join(', ')}].`,
        );
      }
    }
  }
}
