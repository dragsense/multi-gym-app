// Utils
import { apiRequest } from "@/utils/fetcher";
import { BaseService } from "./base.service.api";

// Types
import type {
  IMessageResponse,
  IPaginatedResponse,
} from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { CreateEquipmentDto, UpdateEquipmentDto, EquipmentDto } from "@shared/dtos";

// Constants
const EQUIPMENT_API_PATH = "/equipment";

// Create base service instance
const equipmentService = new BaseService<
  EquipmentDto,
  CreateEquipmentDto,
  UpdateEquipmentDto
>(EQUIPMENT_API_PATH);

// Re-export common CRUD operations
export const fetchEquipment = (params: IListQueryParams) => equipmentService.get(params);
export const fetchEquipmentItem = (id: string, params?: IListQueryParams) => equipmentService.getSingle(id, params);
export const deleteEquipment = (id: string) => equipmentService.delete(id);

// Equipment-specific methods
export const createEquipment = (data: CreateEquipmentDto) =>
  equipmentService.post(data);
export const updateEquipment = (id: string) => equipmentService.patch(id);
