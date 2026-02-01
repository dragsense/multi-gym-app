// Utils
import { apiRequest } from "@/utils/fetcher";
import { BaseService } from "../base.service.api";

// Types
import type {
  IMessageResponse,
  IPaginatedResponse,
} from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { CreateDoorDto, UpdateDoorDto, DoorDto } from "@shared/dtos";

// Constants
const DOORS_API_PATH = "/doors";

// Create base service instance
const doorService = new BaseService<
  DoorDto,
  CreateDoorDto,
  UpdateDoorDto
>(DOORS_API_PATH);

// Re-export common CRUD operations
export const fetchDoors = (params: IListQueryParams) => doorService.get(params);
export const fetchDoorsByLocation = (locationId: string, params?: IListQueryParams) => 
  doorService.get(params || {}, `/by-location/${locationId}`);
export const fetchDoor = (id: string) => doorService.getSingle(id);
export const deleteDoor = (id: string) => doorService.delete(id);

// Door-specific methods
export const createDoor = (data: CreateDoorDto) =>
  doorService.post(data);
export const updateDoor = (id: string) => doorService.patch(id);
