import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
export const ROLES_KEY = 'roles';
export const SKIP_PERMISSIONS_KEY = 'skipPermissions';

export const Permission = (value: string | string[]) => SetMetadata(PERMISSION_KEY, Array.isArray(value) ? value : [value]);
export const Roles = (value: string | string[]) => SetMetadata(ROLES_KEY, Array.isArray(value) ? value : [value]);

// Combined decorator for both permissions and roles
export const RequirePermissions = (permissions: string | string[], roles?: string | string[]) => {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (permissions) {
      Permission(permissions)(target, propertyKey || '', descriptor || {});
    }
    if (roles) {
      Roles(roles)(target, propertyKey || '', descriptor || {});
    }
  };
};

// Decorator to skip smart permissions for specific methods
export const SkipPermissions = () => SetMetadata(SKIP_PERMISSIONS_KEY, true);

// Decorator to override smart permissions with custom ones
export const OverridePermissions = (permissions: string | string[], roles?: string | string[]) => {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (permissions) {
      Permission(permissions)(target, propertyKey || '', descriptor || {});
    }
    if (roles) {
      Roles(roles)(target, propertyKey || '', descriptor || {});
    }
  };
};
