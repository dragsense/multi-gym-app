// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { TStaffData, TUpdateStaffData } from "@shared/types/staff.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { IStaff } from "@shared/interfaces/staff.interface";

// Constants
const STAFF_API_PATH = "/staff";

// Create base service instance
const staffService = new BaseService<
  IStaff,
  TStaffData,
  TUpdateStaffData
>(STAFF_API_PATH);

// Re-export common CRUD operations
export const fetchStaff = (params: IListQueryParams) =>
  staffService.get(params);
export const fetchStaffMember = (id: string, params?: Record<string, any>) =>
  staffService.getSingle(id, params);
export const createStaff = (data: TStaffData) =>
  staffService.post<IMessageResponse & { user: IStaff }>(data);
export const updateStaff = (id: string, data: TUpdateStaffData) =>
  staffService.patch<IMessageResponse>(id)(data);
export const deleteStaff = (id: string) => staffService.delete(id);

export const getCurrentUserStaff = () =>
  staffService.getSingle(undefined, undefined, "/me");