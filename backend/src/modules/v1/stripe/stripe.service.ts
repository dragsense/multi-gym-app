import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseStripeService } from './services/base-stripe.service';
import { LoggerService } from '@/common/logger/logger.service';

@Injectable()
export class StripeService {
  private readonly logger = new LoggerService(StripeService.name);
  constructor(private readonly baseStripeService: BaseStripeService) {}

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    this.logger.log('Processing Stripe webhook...');

    if (!payload) {
      this.logger.error('No payload received in webhook');
      throw new BadRequestException('No payload received in webhook');
    }

    const stripe = this.baseStripeService.getStripe();

    if (!stripe) {
      this.logger.error('Stripe not initialized');
      throw new BadRequestException('Stripe not initialized');
    }

    const webhookSecret =
      this.baseStripeService.getStripeConfig()?.webhookSecret;

    if (!webhookSecret) {
      this.logger.error(
        'Webhook secret not configured in payment methods settings',
      );
      throw new BadRequestException(
        'Webhook secret not configured in payment methods settings',
      );
    }

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      this.logger.log(`Received webhook event: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          console.log(event.data.object);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      this.logger.log(`Webhook processed successfully: ${event.type}`);
    } catch (error) {
      this.logger.error(
        `Webhook signature verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
