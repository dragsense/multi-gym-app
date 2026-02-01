import { PaymentMethodDto } from '../dtos';
import { IMessageResponse } from './api/response.interface';

export interface IPaymentMethod extends PaymentMethodDto {}

export interface IPaymentMethodResponse extends IMessageResponse {
  paymentMethod: PaymentMethodDto;
}

