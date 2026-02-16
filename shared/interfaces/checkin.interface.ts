import { IMessageResponse } from './api/response.interface';
import { CheckinDto } from '../dtos/checkin-dtos';

export interface ICheckin extends CheckinDto {};

export type TCheckinResponse = {checkin: ICheckin} & IMessageResponse

