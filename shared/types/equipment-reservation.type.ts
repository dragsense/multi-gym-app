import {
  EquipmentTypeDto,
  CreateEquipmentTypeDto,
  UpdateEquipmentTypeDto,
  EquipmentDto,
  CreateEquipmentDto,
  UpdateEquipmentDto,
  EquipmentReservationDto,
  CreateEquipmentReservationDto,
  UpdateEquipmentReservationDto,
  EquipmentListDto,
  EquipmentTypeListDto,
} from "../dtos/equipment-reservation-dtos";
import type {
  IEquipmentType,
  IEquipment,
  IEquipmentReservation,
} from "../interfaces/equipment-reservation.interface";
import type { IPaginatedResponse } from "../interfaces/api/response.interface";

export type TEquipmentTypeData = CreateEquipmentTypeDto | UpdateEquipmentTypeDto;
export type TEquipmentTypeListData = EquipmentTypeListDto;
export type TEquipmentTypePaginatedResponse = IPaginatedResponse<IEquipmentType>;

export type TEquipmentData = CreateEquipmentDto | UpdateEquipmentDto;
export type TEquipmentListData = EquipmentListDto;
export type TEquipmentPaginatedResponse = IPaginatedResponse<IEquipment>;

export type TEquipmentReservationData = CreateEquipmentReservationDto | UpdateEquipmentReservationDto;
export type TEquipmentReservationListData = EquipmentReservationDto;
export type TEquipmentReservationPaginatedResponse = IPaginatedResponse<IEquipmentReservation>;
