import { Injectable } from '@nestjs/common';
import { User } from '@/common/base-user/entities/user.entity';
import { StripeCustomerService } from '@/modules/v1/stripe/services/stripe-customer.service';
import { StripeBillingService } from '@/modules/v1/stripe/services/stripe-billing.service';
import type {
  IPaymentAdapter,
  PaymentCustomerResult,
  PaymentCardInfo,
  PaymentIntentResult,
} from '../interfaces/payment-adapter.interface';

/**
 * Stripe implementation of the payment adapter.
 * Uses Stripe Elements on frontend and Stripe Payment Intents / Customer API on backend.
 */
@Injectable()
export class StripePaymentAdapter implements IPaymentAdapter {
  constructor(
    private readonly stripeCustomerService: StripeCustomerService,
    private readonly stripeBillingService: StripeBillingService,
  ) {}

  async createOrGetCustomer(
    user: User,
    tenantId?: string,
  ): Promise<PaymentCustomerResult> {
    const stripeCustomer =
      await this.stripeCustomerService.createOrGetStripeCustomer(user, tenantId);
    return {
      customerId: stripeCustomer.stripeCustomerId,
      metadata: { stripeCustomerId: stripeCustomer.stripeCustomerId },
    };
  }

  async createPaymentIntent(params: {
    amountCents: number;
    customerId: string;
    paymentMethodId: string;
    currency?: string;
    confirm?: boolean;
    metadata?: Record<string, string>;
    tenantId?: string;
    applicationFeeAmount?: number;
  }): Promise<PaymentIntentResult> {
    const intent = await this.stripeBillingService.createPaymentIntent({
      ...params,
      confirm: params.confirm ?? false,
    });
    return {
      id: intent.id,
      status: intent.status,
      metadata: intent.metadata as Record<string, unknown>,
    };
  }

  async getCardInfoFromPaymentMethod(
    paymentMethodId: string,
    tenantId?: string,
  ): Promise<PaymentCardInfo | null> {
    return this.stripeCustomerService.getCardInfoFromPaymentMethod(
      paymentMethodId,
      tenantId,
    );
  }

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
    setAsDefault: boolean,
    tenantId?: string,
  ): Promise<void> {
    await this.stripeCustomerService.attachPaymentMethod(
      customerId,
      paymentMethodId,
      setAsDefault,
      tenantId,
    );
  }
}
