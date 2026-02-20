import type { IPaymentProcessor } from '../interfaces/payment-processors.interface';

export type TPaymentProcessorData = IPaymentProcessor;
export type TUpdatePaymentProcessorData = Partial<IPaymentProcessor>;
export type TPaymentProcessorListData = IPaymentProcessor[];
