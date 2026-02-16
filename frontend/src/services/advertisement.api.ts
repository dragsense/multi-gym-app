// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IAdvertisement, IAdvertisementResponse } from "@shared/interfaces/advertisement.interface";
import type { TCreateAdvertisementData, TUpdateAdvertisementData } from "@shared/types/advertisement.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Constants
const ADVERTISEMENT_API_PATH = "/advertisements";

// Create base service instance
const advertisementService = new BaseService<
  IAdvertisement,
  TCreateAdvertisementData,
  TUpdateAdvertisementData
>(ADVERTISEMENT_API_PATH);

// Re-export common CRUD operations
export const fetchAdvertisements = (params: IListQueryParams) =>
  advertisementService.get<IAdvertisement>(params);

export const fetchAdvertisement = (id: string, params?: Record<string, any>) =>
  advertisementService.getSingle<IAdvertisement>(id, params);

export const createAdvertisement = (data: TCreateAdvertisementData) =>
  advertisementService.post<IAdvertisementResponse>(data);

export const updateAdvertisement = (id: string) => (data: TUpdateAdvertisementData) =>
  advertisementService.patch<IMessageResponse>(id)(data);

export const deleteAdvertisement = (id: string) =>
  advertisementService.delete(id);

export const updateAdvertisementStatus = (id: string) => (data: { status: string; message?: string }) =>
  advertisementService.patch<IMessageResponse>(id)(data, undefined, "/status");

// Get currently active advertisements (status=ACTIVE, within date range)
export const fetchActiveAdvertisements = (limit?: number) =>
  advertisementService.getAll<IAdvertisement>({ limit }, "/active");

