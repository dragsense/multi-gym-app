// Utils
import type { TMemberMembershipPaymentIntentData } from "@shared/types/membership.type";
import { BaseService } from "../base.service.api";

// Types
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Constants
const MEMBER_MEMBERSHIP_BILLING_API_PATH = "/member-membership-billings/payment-intent";

// Create base service instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const memberMembershipBillingService = new BaseService<any, any, any>(
  MEMBER_MEMBERSHIP_BILLING_API_PATH
);

// Create payment intent for membership
export const createMemberMembershipBillingPaymentIntent = (
  data: TMemberMembershipPaymentIntentData
) =>
  memberMembershipBillingService.post<IMessageResponse>(
    data);
