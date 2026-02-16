import { IMessageResponse } from './api/response.interface';
import { DoorDto } from '../dtos/location-dtos/door.dto';

export interface IDoor extends DoorDto {};

export type TDoorResponse = {door: IDoor} & IMessageResponse
