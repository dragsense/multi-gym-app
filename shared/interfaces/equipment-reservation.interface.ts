import { IMessageResponse } from './api/response.interface';
import { EquipmentTypeDto, EquipmentDto, EquipmentReservationDto } from '../dtos/equipment-reservation-dtos';

export interface IEquipmentType extends EquipmentTypeDto {}

export interface IEquipment extends EquipmentDto {}

export interface IEquipmentReservation extends EquipmentReservationDto {}

export type TEquipmentTypeResponse = { equipmentType: IEquipmentType } & IMessageResponse;
export type TEquipmentResponse = { equipment: IEquipment } & IMessageResponse;
export type TEquipmentReservationResponse = { equipmentReservation: IEquipmentReservation } & IMessageResponse;
