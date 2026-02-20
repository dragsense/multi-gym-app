import type { IMessageResponse } from './api/response.interface';
import { AccessHourDto } from '../dtos/membership-dtos/access-hour-dtos';

export interface IAccessHour extends AccessHourDto {};

export type TAccessHourResponse = {accessHour: IAccessHour} & IMessageResponse

