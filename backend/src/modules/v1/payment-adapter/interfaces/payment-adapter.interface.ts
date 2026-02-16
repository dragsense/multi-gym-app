import { User } from '@/common/base-user/entities/user.entity';

/**
 * Result of creating or fetching a customer for a payment processor.
 */
export interface PaymentCustomerResult {
  customerId: string;
  /** Optional: processor-specific payload (e.g. Stripe Customer object id) */
  metadata?: Record<string, string>;
}

/**
 * Card info returned from a payment method / token.
 */
export interface PaymentCardInfo {
  brand?: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
}

/**
 * Result of creating a payment intent (charge).
 */
export interface PaymentIntentResult {
  id: string;
  status: string;
  /** Optional processor-specific payload */
  metadata?: Record<string, unknown>;
}

/**
 * Payment adapter: each business uses one payment processor (Stripe or Paysafe).
 * Implementations must be PCI-compliant (card data only in processor's hosted UI).
 */
export interface IPaymentAdapter {
  /**
   * Create or get the processor customer for this user in the tenant's context.
   */
  createOrGetCustomer(
    user: User,
    tenantId?: string,
  ): Promise<PaymentCustomerResult>;

  /**
   * Create and optionally confirm a payment intent (charge).
   * paymentMethodId: Stripe PaymentMethod id, or Paysafe single-use token, etc.
   */
  createPaymentIntent(params: {
    amountCents: number;
    customerId: string;
    paymentMethodId: string;
    currency?: string;
    confirm?: boolean;
    metadata?: Record<string, string>;
    tenantId?: string;
    applicationFeeAmount?: number;
  }): Promise<PaymentIntentResult>;

  /**
   * Get card info from a payment method ID or token (last4, brand, exp).
   */
  getCardInfoFromPaymentMethod(
    paymentMethodId: string,
    tenantId?: string,
  ): Promise<PaymentCardInfo | null>;

  /**
   * Attach a payment method to the customer and optionally set as default.
   */
  attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
    setAsDefault: boolean,
    tenantId?: string,
  ): Promise<void>;
}
