import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { BaseStripeService } from './base-stripe.service';
import { LoggerService } from '@/common/logger/logger.service';

@Injectable()
export class StripeBillingService {
  private readonly logger = new LoggerService(StripeBillingService.name);
  constructor(private readonly baseStripeService: BaseStripeService) {}

  async createPaymentIntent(params: {
    amountCents: number;
    customerId: string;
    paymentMethodId: string;
    currency?: string;
    confirm?: boolean;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    const {
      amountCents,
      currency = 'usd',
      customerId,
      paymentMethodId,
      metadata,
      confirm = false,
    } = params;

    const stripe = this.baseStripeService.getStripe();

    try {
      const intent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        confirm,
        off_session: true,
        metadata,
      });

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
  ): Promise<Stripe.Checkout.Session> {
    const stripe = this.baseStripeService.getStripe();

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
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
  ): Promise<Stripe.PaymentIntent> {
    const stripe = this.baseStripeService.getStripe();

    try {
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);
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
  ) {
    const stripe = this.baseStripeService.getStripe();
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
    });
  }
}
