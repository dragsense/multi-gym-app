// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IFacilityInfo, IFacilityInfoResponse } from "@shared/interfaces/facility-info.interface";
import type { TCreateFacilityInfoData, TUpdateFacilityInfoData } from "@shared/types/facility-info.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Constants
const FACILITY_INFO_API_PATH = "/facility-info";

// Create base service instance
const facilityInfoService = new BaseService<
  IFacilityInfo,
  TCreateFacilityInfoData,
  TUpdateFacilityInfoData
>(FACILITY_INFO_API_PATH);

// Re-export common CRUD operations
export const fetchFacilityInfos = (params: IListQueryParams) =>
  facilityInfoService.get<IFacilityInfo>(params);

export const fetchFacilityInfo = (id: string, params?: Record<string, any>) =>
  facilityInfoService.getSingle<IFacilityInfo>(id, params);

export const createFacilityInfo = (data: TCreateFacilityInfoData) =>
  facilityInfoService.post<IFacilityInfoResponse>(data);

export const updateFacilityInfo = (id: string) => (data: TUpdateFacilityInfoData) =>
  facilityInfoService.patch<IMessageResponse>(id)(data);

export const deleteFacilityInfo = (id: string) =>
  facilityInfoService.delete(id);

export const updateFacilityInfoStatus = (id: string) => (data: { status: string; message?: string }) =>
  facilityInfoService.patch<IMessageResponse>(id)(data, undefined, "/status");

