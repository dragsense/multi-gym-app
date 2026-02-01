// Utils
import type { TPermissionData, TResourceData, TRoleData, TUpdatePermissionData, TUpdateResourceData, TUpdateRoleData } from "@shared/types";
import { BaseService } from "./base.service.api";

// Types
import type {
  IRole,
  IPermission,
  IResource,
  IListQueryParams,
  IMessageResponse,
} from "@shared/interfaces";

// Constants
const ROLES_API_PATH = "/roles";
const PERMISSIONS_API_PATH = "/roles/system/permissions";
const RESOURCES_API_PATH = "/roles/system/resources";

// Create base service instances
const roleService = new BaseService<IRole, TRoleData, TUpdateRoleData>(
  ROLES_API_PATH
);
const permissionService = new BaseService<
  IPermission,
  TPermissionData,
  TUpdatePermissionData
>(PERMISSIONS_API_PATH);
const resourceService = new BaseService<
  IResource,
  TResourceData,
  TUpdateResourceData
>(RESOURCES_API_PATH);

// =========================
// Role CRUD Operations
// =========================
export const fetchRoles = (params: IListQueryParams) => roleService.get(params);
export const fetchRole = (id: string, params?: IListQueryParams) =>
  roleService.getSingle(id, params);
export const createRole = (data: TRoleData) => roleService.post(data);
export const updateRole = (id: string) => (data: TUpdateRoleData) =>
  roleService.patch<IMessageResponse>(id)(data);
export const deleteRole = (id: string) => roleService.delete(id);

// =========================
// Permission CRUD Operations
// =========================
export const fetchPermissions = (params: IListQueryParams) =>
  permissionService.get(params);
export const fetchPermission = (id: string, params?: IListQueryParams) =>
  permissionService.getSingle(id, params);
export const createPermission = (data: TPermissionData) =>
  permissionService.post(data);
export const updatePermission = (id: string) => (data: TUpdatePermissionData) =>
  permissionService.patch<IMessageResponse>(id)(data);
export const deletePermission = (id: string) => permissionService.delete(id);

// (Optional) Permissions by Role
export const fetchPermissionsByRole = (
  roleId: string,
  params: IListQueryParams
) => roleService.get<IPermission>(params, `/system/${roleId}/permissions`);

// =========================
// Resource CRUD Operations
// =========================
export const fetchResources = (params: IListQueryParams) =>
  resourceService.get(params);
export const fetchResource = (id: string, params?: IListQueryParams) =>
  resourceService.getSingle(id, params);
export const createResource = (data: TResourceData) => resourceService.post(data);
export const updateResource = (id: string) => (data: TUpdateResourceData) =>
  resourceService.patch<IMessageResponse>(id)(data);
export const deleteResource = (id: string) => resourceService.delete(id);
