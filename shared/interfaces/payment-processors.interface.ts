import type { EPaymentProcessorType } from '../enums/payment-processors.enum';
import { PaymentProcessorDto } from '../dtos/payment-processors-dtos';
import { PaymentCardDto, PaymentCardsResponseDto } from '../dtos/payment-card-dtos';
import type { IMessageResponse } from './api/response.interface';

export interface IPaymentProcessor extends PaymentProcessorDto {}

export interface IPaymentProcessorResponse extends IMessageResponse {
  paymentProcessor: PaymentProcessorDto;
}

/** Response of GET /business/me/payment-processor-type (current business payment processor for UI). */
export interface IMyBusinessPaymentProcessorTypeResponse {
  type: EPaymentProcessorType | null;
  paymentProcessorId: string | null;
}

/** Single payment card from GET /payment-adapter/cards (Stripe or Paysafe). */
export interface IPaymentCard extends PaymentCardDto {}

/** Response of GET /payment-adapter/cards. */
export interface IPaymentCardsResponse extends PaymentCardsResponseDto {}
