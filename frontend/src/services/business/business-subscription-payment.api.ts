// Utils
import { BaseService } from "../base.service.api";

// Types
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import { CreateBusinessSubscriptionPaymentIntentDto } from "@shared/dtos";

// Constants
const BUSINESS_SUBSCRIPTION_BILLING_API_PATH = "/business-billings/payment-intent";

// Create base service instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const businessSubscriptionBillingService = new BaseService<any, any, any>(
    BUSINESS_SUBSCRIPTION_BILLING_API_PATH
);

// Create payment intent for business subscription
export const createBusinessSubscriptionBillingPaymentIntent = (
    data: CreateBusinessSubscriptionPaymentIntentDto
) =>
    businessSubscriptionBillingService.post<IMessageResponse>(
        data);

