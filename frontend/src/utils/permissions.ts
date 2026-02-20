import type { IUser } from "@shared/interfaces/user.interface";
import { EResource } from "@shared/enums";
import { EPermissionAction } from "@shared/enums";

/**
 * Get all permission names from user (from both direct permissions and privileges)
 */
export function getUserPermissionNames(user: IUser | null | undefined): string[] {
  if (!user) return [];

  const permissionNames: string[] = [];

  // Get permissions from direct user permissions
  if (user.permissions) {
    user.permissions.forEach((permission) => {
      if (permission.permission?.name) {
        permissionNames.push(permission.permission.name);
      }
    });
  }

  // Get permissions from user privileges
  if (user.privileges) {
    user.privileges.forEach((privilege) => {
      if (privilege.permissions) {
        privilege.permissions.forEach((privilegePermission) => {
          if (privilegePermission.permission?.name) {
            permissionNames.push(privilegePermission.permission.name);
          }
        });
      }
    });
  }

  return permissionNames;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: IUser | null | undefined,
  resource: EResource,
  action: EPermissionAction[]
): boolean {
  if (!user) return false;

  const permissionNames = getUserPermissionNames(user);
  const requiredPermission = action.map(action => `${resource}:${action}`).join(',');

  // Check for exact permission
  if (permissionNames.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard permissions
  if (
    permissionNames.includes(`${resource}:*`) ||
    permissionNames.some(name => name.startsWith(`*:${action}`)) ||
    permissionNames.includes('*:*')
  ) {
    return true;
  }

  return false;
}

/**
 * Check if user has any permission for a resource (any action)
 */
export function hasResourcePermission(
  user: IUser | null | undefined,
  resource: EResource
): boolean {
  if (!user) return false;

  const permissionNames = getUserPermissionNames(user);



  // Check for any permission on this resource
  return permissionNames.some(
    (name) => name.startsWith(`${resource}:`) || name === '*:*' || name === `${resource}:*`
  );
}

/**
 * Check if user has read permission for a resource (most common check for navigation)
 */
export function canReadResource(
  user: IUser | null | undefined,
  resource: EResource
): boolean {
  return hasPermission(user, resource, [EPermissionAction.READ, EPermissionAction.MANAGE]);
}
