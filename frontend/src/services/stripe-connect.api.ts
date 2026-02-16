// Utils
import { BaseService } from "./base.service.api";

// Types
import type {
  StripeConnectStatusDto,
  StripeConnectCreateResponseDto,
  CreateStripeConnectDto,
} from "@shared/dtos";

// Constants
const STRIPE_CONNECT_API_PATH = "/stripe-connect";

// Create base service instance
const stripeConnectService = new BaseService<any, any, any>(
  STRIPE_CONNECT_API_PATH
);

/**
 * Get the connected Stripe account ID for the current tenant.
 * Returns null if no connected account exists.
 */
export const getConnectedAccountId = (): Promise<{
  stripeAccountId: string | null;
}> =>
  stripeConnectService.getSingle<{ stripeAccountId: string | null }>(
    undefined,
    undefined,
    "/account-id"
  );

/**
 * Create a Stripe Connect account for the current user's business
 */
export const createStripeConnectAccount = (
  data: CreateStripeConnectDto
): Promise<StripeConnectCreateResponseDto> =>
  stripeConnectService.post<StripeConnectCreateResponseDto>(data);

/**
 * Get Stripe Connect account status for the current user's business
 */
export const getStripeConnectStatus =
  (): Promise<StripeConnectStatusDto> =>
    stripeConnectService.getSingle<StripeConnectStatusDto>(
      undefined,
      undefined
    );

/**
 * Generate a new onboarding link for incomplete account
 */
export const getStripeOnboardingLink =
  (): Promise<StripeConnectCreateResponseDto> =>
    stripeConnectService.post<StripeConnectCreateResponseDto>(
      {},
      undefined,
      "/onboarding-link"
    );

/**
 * Disconnect Stripe Connect account from the business
 */
export const disconnectStripeConnect = (): Promise<{ message: string }> =>
  stripeConnectService.delete<{ message: string }>(null);
