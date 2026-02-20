// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IDeviceReader, IDeviceReaderResponse } from "@shared/interfaces/device-reader.interface";
import type { TCreateDeviceReaderData, TUpdateDeviceReaderData } from "@shared/types/device-reader.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Constants
const DEVICE_READER_API_PATH = "/device-readers";

// Create base service instance
const deviceReaderService = new BaseService<
  IDeviceReader,
  TCreateDeviceReaderData,
  TUpdateDeviceReaderData
>(DEVICE_READER_API_PATH);

// Re-export common CRUD operations
export const fetchDeviceReaders = (params: IListQueryParams, locationId?: string) =>
  deviceReaderService.get<IDeviceReader>({ ...params, filters: { ...(params.filters || {}), locationId } });

export const fetchDeviceReader = (id: string, params?: Record<string, any>) =>
  deviceReaderService.getSingle<IDeviceReader>(id, params);

export const createDeviceReader = (data: TCreateDeviceReaderData) =>
  deviceReaderService.post<IDeviceReaderResponse>(data);

export const updateDeviceReader = (id: string) => (data: TUpdateDeviceReaderData) =>
  deviceReaderService.patch<IMessageResponse>(id)(data);

export const deleteDeviceReader = (id: string) =>
  deviceReaderService.delete(id);

export const updateDeviceReaderStatus = (id: string) => (data: { status: any; message?: string }) =>
  deviceReaderService.patch<IMessageResponse>(id)(data, undefined, "/status");

