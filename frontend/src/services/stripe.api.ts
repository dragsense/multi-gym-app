// Utils
import type { IStripeCard } from "@/@types/payment.types";
import { BaseService } from "./base.service.api";

// Types
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";



// Constants
const STRIPE_CUSTOMER_API_PATH = "/stripe-customer";

// Create base service instance
const stripeCustomerService = new BaseService<any, any, any>(
  STRIPE_CUSTOMER_API_PATH
);

// Get all payment cards
export const fetchStripePaymentCards = (): Promise<{ paymentMethods: IStripeCard[], defaultPaymentMethodId: string | null }> =>
  stripeCustomerService.getSingle<{ paymentMethods: IStripeCard[], defaultPaymentMethodId: string | null }>(undefined, undefined, "/cards");

export const fetchUserDefaultPaymentMethod = (userId: string): Promise<IStripeCard> =>
  stripeCustomerService.getSingle<IStripeCard>(undefined, undefined, `/${userId}/cards/default`);

// Get customer info
export const fetchStripeCustomerInfo = () =>
  stripeCustomerService.getSingle(null, undefined, "/info");

// Set a card as default payment method
export const setDefaultPaymentMethod = (paymentMethodId: string): Promise<IMessageResponse> =>
  stripeCustomerService.post({}, undefined, `/cards/${paymentMethodId}/default`);

// Delete a payment method (card)
export const deletePaymentMethod = (paymentMethodId: string): Promise<IMessageResponse> =>
  stripeCustomerService.delete(paymentMethodId, undefined, "/cards");

// Add a new payment method (card)
export const addPaymentMethod = (paymentMethodId: string, setAsDefault: boolean = false): Promise<IMessageResponse> =>
  stripeCustomerService.post({ paymentMethodId, setAsDefault }, undefined, "/cards");
