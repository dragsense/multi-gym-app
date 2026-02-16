// Utils
import { apiRequest } from "@/utils/fetcher";
import { BaseService } from "../base.service.api";

// Types
import type {
  IMessageResponse,
  IPaginatedResponse,
} from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { CreateAccessHourDto, UpdateAccessHourDto, AccessHourDto } from "@shared/dtos";

// Constants
const ACCESS_HOURS_API_PATH = "/access-hours";

// Create base service instance
const accessHourService = new BaseService<
  AccessHourDto,
  CreateAccessHourDto,
  UpdateAccessHourDto
>(ACCESS_HOURS_API_PATH);

// Re-export common CRUD operations
export const fetchAccessHours = (params: IListQueryParams) => accessHourService.get(params);
export const fetchAccessHour = (id: string) => accessHourService.getSingle(id);
export const deleteAccessHour = (id: string) => accessHourService.delete(id);

// Access hour-specific methods
export const createAccessHour = (data: CreateAccessHourDto) =>
  accessHourService.post(data);
export const updateAccessHour = (id: string) => accessHourService.patch(id);

