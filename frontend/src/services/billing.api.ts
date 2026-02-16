// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IBilling } from "@shared/interfaces/billing.interface";
import type { TQueryParams } from "@shared/types";
import type {
  TBillingData,
  TBillingPaymentIntentData,
} from "@shared/types/billing.type";

// Constants
const BILLINGS_API_PATH = "/billings";

// Create base service instance
const billingService = new BaseService<
  IBilling,
  TBillingData | TBillingPaymentIntentData,
  Partial<TBillingData> | Partial<TBillingPaymentIntentData>
>(BILLINGS_API_PATH);

// Re-export common CRUD operations
export const fetchBillings = (params: IListQueryParams) =>
  billingService.get(params);
export const fetchBilling = (id: string, params: IListQueryParams) =>
  billingService.getSingle(id, params);
export const createBilling = (data: TBillingData) => billingService.post(data);
export const updateBilling = (id: string) => billingService.patch(id);
export const deleteBilling = (id: string) => billingService.delete(id);

// Custom endpoints
export const createCheckoutSession = (
  id: string,
  data: { paymentSuccessUrl: string; paymentCancelUrl: string }
) =>
  billingService.post<Record<string, never>>(
    data as unknown as TBillingData,
    undefined,
    `/${id}/checkout-url`
  );

export const handleCheckoutSuccess = (token: string, sessionId: string) =>
  billingService.getSingle(
    undefined,
    { token, session_id: sessionId },
    "/checkout/success"
  );

export const handleCheckoutCancel = () =>
  billingService.getSingle(undefined, undefined, "/checkout/cancel");

export const sendBillingEmail = (id: string) =>
  billingService.post({}, undefined, `/${id}/send-email`);

export const createBillingPaymentIntent = (data: TBillingPaymentIntentData) =>
  billingService.post<{ message: string }>(data, undefined, "/payment-intent");

export const downloadBillingInvoicePdf = (id: string) =>
  billingService.downloadFileWithName(`/${id}/invoice-pdf`);

export const fetchBillingInvoiceHtml = (id: string) =>
  billingService.getSingle<string | null>(
    undefined,
    undefined,
    `/${id}/invoice-html`
  );

export const updateBillingNotes = (
  id: string,
  data: {
    notes?: string;
  }
) => billingService.patch<{ message: string }>(id)(data, undefined, "/notes");

export const updateBillingStatus = (
  id: string,
  data: {
    status: string;
    message?: string;
  }
) => billingService.patch<{ message: string }>(id)(data, undefined, "/status");

// Get outstanding billing summary for a member
export const fetchOutstandingBillingSummary = (
  userId: string,
  params?: TQueryParams
) => {
  return billingService.getSingle<{
    recentBillings: IBilling[];
    totalOutstanding: number;
    totalOutstandingCount: number;
  }>(undefined, params, `/user/${userId}/recent`);
};

// Get billings for a specific user
export const fetchUserBillings = (
  userId: string,
  params?: IListQueryParams
) => {
  return billingService.get<IBilling>(
    params,
    `/user/${userId}`
  );
};

// Get my outstanding billings summary (for current logged-in user)
export const fetchMyOutstandingBillingSummary = (
  params?: TQueryParams
) => {
  return billingService.getSingle<{
    recentBillings: IBilling[];
    totalOutstanding: number;
    totalOutstandingCount: number;
  }>(undefined, params, `/me/outstanding`);
};
