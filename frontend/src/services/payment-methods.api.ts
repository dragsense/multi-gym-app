// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IPaymentMethod } from "@shared/interfaces/payment-methods.interface";
import type { TPaymentMethodData } from "@shared/types/payment-methods.type";

// Constants
const PAYMENT_METHODS_API_PATH = "/payment-methods";

// Create base service instance
const paymentMethodsService = new BaseService<
  IPaymentMethod,
  TPaymentMethodData,
  Partial<TPaymentMethodData>
>(PAYMENT_METHODS_API_PATH);

// Re-export common CRUD operations
export const fetchPaymentMethods = (params: IListQueryParams) =>
  paymentMethodsService.get(params);
export const fetchPaymentMethod = (id: string, params: IListQueryParams) =>
  paymentMethodsService.getSingle(id, params);
export const createPaymentMethod = (data: TPaymentMethodData) =>
  paymentMethodsService.post(data);
export const updatePaymentMethod = (id: string) =>
  paymentMethodsService.patch(id);
export const deletePaymentMethod = (id: string) =>
  paymentMethodsService.delete(id);

// Custom endpoints
export const fetchEnabledPaymentMethods = () =>
  paymentMethodsService.getSingle("enabled/list");
export const togglePaymentMethod = (id: string) =>
  paymentMethodsService.patch(`${id}/toggle`);
