// Utils
import { apiRequest } from "@/utils/fetcher";
import { BaseService } from "./base.service.api";

// Types
import type {
  IMessageResponse,
  IPaginatedResponse,
} from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { CreateEquipmentTypeDto, UpdateEquipmentTypeDto, EquipmentTypeDto } from "@shared/dtos";

// Constants
const EQUIPMENT_TYPES_API_PATH = "/equipment-types";

// Create base service instance
const equipmentTypeService = new BaseService<
  EquipmentTypeDto,
  CreateEquipmentTypeDto,
  UpdateEquipmentTypeDto
>(EQUIPMENT_TYPES_API_PATH);

// Re-export common CRUD operations
export const fetchEquipmentTypes = (params: IListQueryParams) => equipmentTypeService.get(params);
export const fetchEquipmentType = (id: string, params?: IListQueryParams) => equipmentTypeService.getSingle(id, params);
export const deleteEquipmentType = (id: string) => equipmentTypeService.delete(id);

// Equipment type-specific methods
export const createEquipmentType = (data: CreateEquipmentTypeDto) =>
  equipmentTypeService.post(data);
export const updateEquipmentType = (id: string) => equipmentTypeService.patch(id);
