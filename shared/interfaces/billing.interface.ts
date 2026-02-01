import { BillingDto } from '../dtos';
import { IMessageResponse } from './api/response.interface';

export interface IBilling extends BillingDto {}
export interface IBillingResponse extends IMessageResponse {
  billing: BillingDto;
}
