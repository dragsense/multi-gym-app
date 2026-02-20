import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { BaseStripeService } from './base-stripe.service';
import { LoggerService } from '@/common/logger/logger.service';
import { StripeConnectService } from './stripe-connect.service';
import { StripeConnectAccount } from '../entities/stripe-connect-account.entity';

@Injectable()
export class StripeBillingService {
  private readonly logger = new LoggerService(StripeBillingService.name);
  constructor(private readonly baseStripeService: BaseStripeService,
    private readonly stripeConnectService: StripeConnectService,
  ) { }

  async createPaymentIntent(params: {
    amountCents: number;
    customerId: string;
    paymentMethodId: string;
    currency?: string;
    confirm?: boolean;
    metadata?: Record<string, string>;
    tenantId?: string;
    applicationFeeAmount?: number;
  }): Promise<Stripe.PaymentIntent> {
    const {
      amountCents,
      currency = 'usd',
      customerId,
      paymentMethodId,
      metadata,
      confirm = false,
      tenantId,
      applicationFeeAmount,
    } = params;

    const stripe = this.baseStripeService.getStripe();

    try {
      const intentParams: Stripe.PaymentIntentCreateParams = {
        amount: amountCents,
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        confirm,
        off_session: true,
        metadata,
      };

      let connectedAccount: StripeConnectAccount | null = null;
      if (tenantId) {
        connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
      }

      // Direct charge on connected account: platform can take an application fee
      if (connectedAccount && applicationFeeAmount && applicationFeeAmount > 0) {
        intentParams.application_fee_amount = applicationFeeAmount;
      }

      const requestOptions: Stripe.RequestOptions | undefined = connectedAccount
        ? { stripeAccount: connectedAccount.stripeAccountId }
        : undefined;

      const intent = await stripe.paymentIntents.create(intentParams, requestOptions);

      return intent;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create payment intent: ${errorMessage}`);
      throw new BadRequestException(
        `Failed to create payment intent: ${errorMessage}`,
      );
    }
  }

  async getCheckoutSession(
    sessionId: string,
    tenantId?: string,
  ): Promise<Stripe.Checkout.Session> {
    const stripe = this.baseStripeService.getStripe();

    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
      return session;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error retrieving checkout session ${sessionId}: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Failed to retrieve checkout session: ${errorMessage}`,
      );
    }
  }

  async getPaymentIntent(
    paymentIntentId: string,
    tenantId?: string,
  ): Promise<Stripe.PaymentIntent> {
    const stripe = this.baseStripeService.getStripe();

    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }

    try {
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
      return paymentIntent;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error retrieving payment intent ${paymentIntentId}: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Failed to retrieve payment intent: ${errorMessage}`,
      );
    }
  }

  //for pos
  async createCheckoutSession(
    customerId: string,
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    metadata: Record<string, string>,
    successUrl: string,
    cancelUrl: string,
    createInvoice: boolean = false,
    tenantId?: string,
  ) {
    const stripe = this.baseStripeService.getStripe();
    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }
    return stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      invoice_creation: {
        enabled: createInvoice,
        invoice_data: {
          metadata: metadata,
        },
      },
    }, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
  }
}
