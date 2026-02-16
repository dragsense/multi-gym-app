// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { ILocation, ILocationResponse } from "@shared/interfaces/location.interface";
import type { TCreateLocationData, TUpdateLocationData } from "@shared/types/location.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Constants
const LOCATION_API_PATH = "/locations";

// Create base service instance
const locationService = new BaseService<
  ILocation,
  TCreateLocationData,
  TUpdateLocationData
>(LOCATION_API_PATH);

// Re-export common CRUD operations
export const fetchLocations = (params: IListQueryParams) =>
  locationService.get<ILocation>(params);

export const fetchLocation = (id: string, params?: Record<string, any>) =>
  locationService.getSingle<ILocation>(id, params);

export const createLocation = (data: TCreateLocationData) =>
  locationService.postFormData<ILocationResponse>(data);

export const updateLocation = (id: string) => (data: TUpdateLocationData) =>
  locationService.patchFormData<IMessageResponse>(id)(data);

export const deleteLocation = (id: string) =>
  locationService.delete(id);

