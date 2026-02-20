import { BillingDto } from '../dtos';
import type { IMessageResponse } from './api/response.interface';

export interface IBilling extends BillingDto {}
export interface IBillingResponse extends IMessageResponse {
  billing: BillingDto;
}
