import { BaseService } from "./base.service.api";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { IPaymentCard, IPaymentCardsResponse } from "@shared/interfaces";

const PAYMENT_ADAPTER_API_PATH = "/payment-adapter";
const paymentAdapterService = new BaseService<any, any, any>(PAYMENT_ADAPTER_API_PATH);

/** Get all saved cards (payment-adapter: Stripe or Paysafe by tenant). */
export const fetchPaymentCards = (): Promise<IPaymentCardsResponse> =>
  paymentAdapterService.getSingle<IPaymentCardsResponse>(undefined, undefined, "/cards");

/** Get default payment method for current user */
export const fetchDefaultPaymentMethod = (): Promise<IPaymentCard | null> =>
  paymentAdapterService.getSingle<IPaymentCard | null>(
    undefined,
    undefined,
    "/cards/default"
  );

/** Get default payment method for a user (admin) */
export const fetchUserDefaultPaymentMethod = (userId: string): Promise<IPaymentCard | null> =>
  paymentAdapterService.getSingle<IPaymentCard | null>(
    undefined,
    undefined,
    `/${userId}/cards/default`
  );

/** Set a card as default */
export const setDefaultPaymentMethod = (paymentMethodId: string): Promise<IMessageResponse> =>
  paymentAdapterService.post({}, undefined, `/cards/${paymentMethodId}/default`);

/** Delete a payment method */
export const deletePaymentMethod = (paymentMethodId: string): Promise<IMessageResponse> =>
  paymentAdapterService.delete<IMessageResponse>(null, undefined, `/cards/${paymentMethodId}`);

/** Add a new payment method (Stripe PM id or Paysafe single-use token) */
export const addPaymentMethod = (
  paymentMethodId: string,
  setAsDefault: boolean = false
): Promise<IMessageResponse> =>
  paymentAdapterService.post<IMessageResponse>(
    { paymentMethodId, setAsDefault },
    undefined,
    "/cards"
  );
