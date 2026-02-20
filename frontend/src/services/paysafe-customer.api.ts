import type { IStripeCard } from "@/@types/payment.types";
import { BaseService } from "./base.service.api";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

const PAYSAFE_CUSTOMER_API_PATH = "/paysafe-customer";
const paysafeCustomerService = new BaseService<any, any, any>(
  PAYSAFE_CUSTOMER_API_PATH
);

export const fetchPaysafePaymentCards = (): Promise<{
  paymentMethods: IStripeCard[];
  defaultPaymentMethodId: string | null;
}> =>
  paysafeCustomerService.getSingle<{
    paymentMethods: IStripeCard[];
    defaultPaymentMethodId: string | null;
  }>(undefined, undefined, "/cards");

export const fetchPaysafeUserDefaultPaymentMethod = (
  userId: string
): Promise<IStripeCard | null> =>
  paysafeCustomerService.getSingle<IStripeCard | null>(
    undefined,
    undefined,
    `/${userId}/cards/default`
  );

export const fetchPaysafeDefaultPaymentMethod = (): Promise<IStripeCard | null> =>
  paysafeCustomerService.getSingle<IStripeCard | null>(
    undefined,
    undefined,
    `/cards/default`
  );

export const setPaysafeDefaultPaymentMethod = (
  paymentMethodId: string
): Promise<IMessageResponse> =>
  paysafeCustomerService.post({}, undefined, `/cards/${paymentMethodId}/default`);

export const deletePaysafePaymentMethod = (
  paymentMethodId: string
): Promise<IMessageResponse> =>
  paysafeCustomerService.delete<IMessageResponse>(null, undefined, `/cards/${paymentMethodId}`);

export const addPaysafePaymentMethod = (
  paymentMethodId: string,
  setAsDefault: boolean = false
): Promise<IMessageResponse> =>
  paysafeCustomerService.post<IMessageResponse>(
    { paymentMethodId, setAsDefault },
    undefined,
    "/cards"
  );

