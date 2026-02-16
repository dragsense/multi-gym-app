import { PaymentProcessorDto } from '../dtos/payment-processors-dtos';
import { IMessageResponse } from './api/response.interface';

export interface IPaymentProcessor extends PaymentProcessorDto {}

export interface IPaymentProcessorResponse extends IMessageResponse {
  paymentProcessor: PaymentProcessorDto;
}
