// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { ITrainerService, ITrainerServiceResponse } from "@shared/interfaces/trainer-service.interface";
import type { TCreateTrainerServiceData, TUpdateTrainerServiceData } from "@shared/types/trainer-service.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Constants
const TRAINER_SERVICE_API_PATH = "/trainer-services";

// Create base service instance
const trainerServiceService = new BaseService<
  ITrainerService,
  TCreateTrainerServiceData,
  TUpdateTrainerServiceData
>(TRAINER_SERVICE_API_PATH);

// Re-export common CRUD operations
export const fetchTrainerServices = (params: IListQueryParams) =>
  trainerServiceService.get<ITrainerService>(params);

export const fetchTrainerService = (id: string, params?: Record<string, any>) =>
  trainerServiceService.getSingle<ITrainerService>(id, params);

export const createTrainerService = (data: TCreateTrainerServiceData) =>
  trainerServiceService.post<ITrainerServiceResponse>(data);

export const updateTrainerService = (id: string) => (data: TUpdateTrainerServiceData) =>
  trainerServiceService.patch<IMessageResponse>(id)(data);

export const deleteTrainerService = (id: string) =>
  trainerServiceService.delete(id);

export const updateTrainerServiceStatus = (id: string) => (data: { status: string; message?: string }) =>
  trainerServiceService.patch<IMessageResponse>(id)(data, undefined, "/status");

