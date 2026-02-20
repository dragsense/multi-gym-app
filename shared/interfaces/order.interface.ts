import { OrderDto } from '../dtos';
import { EPaymentPreference } from '../enums/membership.enum';
import type { IMessageResponse } from './api/response.interface';

export interface IOrder extends OrderDto {}

export interface IOrderResponse extends IMessageResponse {
  order?: OrderDto;
}

/** Checkout payload (create order from cart). Aligned with CheckoutDto. */
export interface ICheckout {
  title?: string;
  paymentPreference: EPaymentPreference;
  paymentMethodId?: string;
  saveForFutureUse?: boolean;
  setAsDefault?: boolean;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingState?: string;
  shippingZip: string;
  shippingCountry: string;
}

/** Checkout API response (order created from cart). */
export interface ICheckoutResponse extends IMessageResponse {
  order?: IOrder;
}
