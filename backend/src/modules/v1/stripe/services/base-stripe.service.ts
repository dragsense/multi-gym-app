import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { LoggerService } from '@/common/logger/logger.service';
import { PaymentProcessorsService } from '@/common/payment-processors/payment-processors.service';
import { EPaymentProcessorType } from '@shared/enums/payment-processors.enum';

@Injectable()
export class BaseStripeService {
  protected readonly logger = new LoggerService(this.constructor.name);
  stripe: Stripe | null = null;
  stripeConfig: {
    secretKey: string;
    webhookSecret?: string;
    publishableKey: string;
  } | null = null;

  constructor(
    protected readonly configService: ConfigService,
    private readonly paymentProcessorsService: PaymentProcessorsService,
  ) {
    this.logger.log('Initializing Stripe service...');

    this.isStripeEnabled()
      .then((isStripeEnabled) => {
        if (isStripeEnabled) {
          this.initializeStripe();
        } else {
          this.logger.warn('Stripe is not enabled, skipping initialization');
        }
      })
      .catch((error) => {
        this.logger.error(
          'Error checking if Stripe is enabled:',
          error instanceof Error ? error.message : String(error),
        );
      });
  }

  /**
   * Check if Stripe is enabled by checking payment processor
   */
  async isStripeEnabled(): Promise<boolean> {
    try {
      const stripeProcessor = await this.paymentProcessorsService.getSingle({
        type: EPaymentProcessorType.STRIPE,
      });
      return !!stripeProcessor && stripeProcessor.enabled;
    } catch {
      this.logger.warn('Stripe payment processor not found or not active');
      throw new Error('Stripe payment processor not found or not active');
    }
  }

  /**
   * Initialize Stripe with configuration
   */
  private initializeStripe() {
    try {
      this.logger.log('Initializing Stripe service...');

      const stripeConfig = this.configService.get('paymentProcessors.stripe') as {
        secretKey: string;
        webhookSecret?: string;
        publishableKey: string;
      };
      if (stripeConfig) {
        this.stripe = new Stripe(stripeConfig.secretKey);
        this.stripeConfig = stripeConfig;
        this.logger.log(
          'Stripe initialized successfully with database configuration' as string,
        );
      }
    } catch (error) {
      this.logger.error(
        'Error initializing Stripe:',
        error instanceof Error ? error.message : String(error),
      );
      this.stripe = null;
      throw error;
    }
  }

  /**
   * Ensure Stripe is initialized before use
   */
  protected ensureStripeInitialized() {
    if (!this.stripe || !this.stripeConfig) {
      this.logger.log('Stripe not initialized, attempting to initialize...');
      this.initializeStripe();
    }

    if (!this.stripe) {
      this.logger.error('Stripe initialization failed - service not available');
      throw new BadRequestException(
        'Stripe is not configured. Please configure Stripe in Payment Processors settings or install stripe package.',
      );
    }
  }

  /**
   * Get the Stripe instance (ensures it's initialized)
   */
  getStripe(): Stripe {
    this.ensureStripeInitialized();
    return this.stripe!;
  }

  /**
   * Get the Stripe configuration
   */
  getStripeConfig() {
    return this.stripeConfig;
  }
}
