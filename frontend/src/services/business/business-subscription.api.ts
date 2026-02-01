import { BaseService } from "../base.service.api";
import type { BusinessSubscriptionStatusDto, BusinessSubscriptionDto, BusinessSubscriptionHistoryDto, BusinessSubscriptionBillingDto, CurrentBusinessSubscriptionSummaryDto } from "@shared/dtos";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";

const BUSINESS_SUBSCRIPTION_API_PATH = "/business-subscriptions";

// Create base service instance
const businessSubscriptionService = new BaseService(BUSINESS_SUBSCRIPTION_API_PATH);

export const getMyBusinessSubscriptionStatus = (): Promise<BusinessSubscriptionStatusDto> =>
    businessSubscriptionService.getSingle<BusinessSubscriptionStatusDto>(undefined, undefined, "/me/subscription/status");

// Get my business subscription summary (full info including name, price, color, etc.)
export const getMyBusinessSubscriptionSummary = (): Promise<CurrentBusinessSubscriptionSummaryDto> =>
    businessSubscriptionService.getSingle<CurrentBusinessSubscriptionSummaryDto>(undefined, undefined, "/me/subscription/summary");

// Get current active subscription for a business
export const fetchCurrentBusinessSubscription = (
    businessId: string,
    params?: Record<string, any>
): Promise<BusinessSubscriptionDto> =>
    businessSubscriptionService.getSingle<BusinessSubscriptionDto>(undefined, params, `/business/${businessId}/current`);

// Get business subscription status by business ID
export const fetchBusinessSubscriptionStatus = (
    businessId: string
): Promise<BusinessSubscriptionStatusDto> =>
    businessSubscriptionService.getSingle<BusinessSubscriptionStatusDto>(undefined, undefined, `/business/${businessId}/status`);

// Get all business subscriptions for a business
export const fetchBusinessSubscriptions = (
    businessId: string,
    params?: IListQueryParams
): Promise<BusinessSubscriptionDto[]> => {
    return businessSubscriptionService.getAll<BusinessSubscriptionDto>(
        params as any,
        `/business/${businessId}`
    );
};

// Get business subscription history by business subscription ID
export const fetchBusinessSubscriptionHistory = (
    businessSubscriptionId: string,
    params?: IListQueryParams
): Promise<BusinessSubscriptionHistoryDto[]> => {
    return businessSubscriptionService.getAll<BusinessSubscriptionHistoryDto>(
        params as any,
        `/${businessSubscriptionId}/history`
    );
};

// Get paginated business subscription history for a business by businessId
export const fetchBusinessSubscriptionHistoryByBusinessId = (
    businessId: string,
    params?: IListQueryParams
) => {
    const historyService = new BaseService("/business-subscription-history");
    return historyService.get<BusinessSubscriptionHistoryDto>(
        params as any,
        `/business/${businessId}`
    );
};

// Get all business subscription history for a business by businessId (for frontend pagination)
export const fetchAllBusinessSubscriptionHistory = (
    businessId: string
): Promise<BusinessSubscriptionHistoryDto[]> => {
    const historyService = new BaseService("/business-subscription-history");
    return historyService.getAll<BusinessSubscriptionHistoryDto>(
        undefined,
        `/business/${businessId}/all`
    );
};

// Get business subscription billings
export const fetchBusinessSubscriptionBillings = (
    businessSubscriptionId: string,
    params?: IListQueryParams
): Promise<{ data: BusinessSubscriptionBillingDto[]; meta?: any }> => {
    const billingService = new BaseService("/business-billings");
    return billingService.get<BusinessSubscriptionBillingDto>(params, `?businessSubscriptionId=${businessSubscriptionId}`);
};
