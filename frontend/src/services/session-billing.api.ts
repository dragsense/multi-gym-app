// Utils
import { BaseService } from "./base.service.api";

// Types
import type { TSessionPaymentIntentData } from "@shared/types/session.type";

// Constants
const SESSION_BILLINGS_API_PATH = "/session-billings";

// Create base service instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessionBillingService = new BaseService<any, any, any>(
  SESSION_BILLINGS_API_PATH
);

// Create payment intent for session
export const createSessionPaymentIntent = (data: TSessionPaymentIntentData) =>
  sessionBillingService.post<{ message: string }>(
    data,
    undefined,
    "/payment-intent"
  );

// Get session billings for a session
export const fetchSessionBillings = (sessionId: string) =>
  sessionBillingService.getSingle(
    sessionId,
    undefined,
    `/session/${sessionId}`
  );

// Get session billings for a member
export const fetchMemberSessionBillings = (memberId: string) =>
  sessionBillingService.getSingle(memberId, undefined, `/member/${memberId}`);

// Check if a member has paid for a specific session
export const checkMemberSessionPayment = (
  sessionId: string,
  memberId: string
) =>
  sessionBillingService.getSingle<{
    hasPaid: boolean;
    paidAt?: Date | null;
  }>(
    null,
    undefined,
    `/session/${sessionId}/member/${memberId}/payment-status`
  );
