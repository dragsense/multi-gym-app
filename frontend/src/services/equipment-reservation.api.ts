// Utils
import { apiRequest } from "@/utils/fetcher";
import { BaseService } from "./base.service.api";

// Types
import type {
  IMessageResponse,
  IPaginatedResponse,
} from "@shared/interfaces/api/response.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { CreateEquipmentReservationDto, UpdateEquipmentReservationDto, EquipmentReservationDto } from "@shared/dtos";

// Constants
const EQUIPMENT_RESERVATIONS_API_PATH = "/equipment-reservations";

// Create base service instance
const equipmentReservationService = new BaseService<
  EquipmentReservationDto,
  CreateEquipmentReservationDto,
  UpdateEquipmentReservationDto
>(EQUIPMENT_RESERVATIONS_API_PATH);

// Re-export common CRUD operations
export const fetchEquipmentReservations = (params: IListQueryParams) => equipmentReservationService.get(params);
export const fetchEquipmentReservation = (id: string, params?: IListQueryParams) => equipmentReservationService.getSingle(id, params);
export const deleteEquipmentReservation = (id: string) => equipmentReservationService.delete(id);

// Equipment reservation-specific methods
export const createEquipmentReservation = (data: CreateEquipmentReservationDto) =>
  equipmentReservationService.post(data);
export const updateEquipmentReservation = (id: string) => equipmentReservationService.patch(id);

// Get reservations for a specific user
export const fetchUserEquipmentReservations = (
  userId: string,
  params?: IListQueryParams
) => {
  return equipmentReservationService.get<EquipmentReservationDto>(
    params,
    `/user/${userId}`
  );
};
