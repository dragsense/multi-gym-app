import { BaseService } from "./base.service.api";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IPaymentProcessor } from "@shared/interfaces/payment-processors.interface";
import type { TPaymentProcessorData } from "@shared/types/payment-processors.type";

const PAYMENT_PROCESSORS_API_PATH = "/payment-processors";

const paymentProcessorsService = new BaseService<
  IPaymentProcessor,
  TPaymentProcessorData,
  Partial<TPaymentProcessorData>
>(PAYMENT_PROCESSORS_API_PATH);

export const fetchPaymentProcessors = (params?: IListQueryParams) =>
  paymentProcessorsService.get(params);

export const fetchPaymentProcessor = (id: string, params?: IListQueryParams) =>
  paymentProcessorsService.getSingle(id, params);

export const createPaymentProcessor = (data: TPaymentProcessorData) =>
  paymentProcessorsService.post(data);

export const updatePaymentProcessor = (id: string) =>
  paymentProcessorsService.patch(id);

export const deletePaymentProcessor = (id: string) =>
  paymentProcessorsService.delete(id);
