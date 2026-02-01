import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { LoggerService } from '@/common/logger/logger.service';
import { PaymentMethodsService } from '@/common/payment-methods/payment-methods.service';
import { EPaymentMethodType } from '@shared/enums/payment-methods.enum';

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
    private readonly paymentMethodsService: PaymentMethodsService,
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
   * Check if Stripe is enabled by checking payment method
   */
  async isStripeEnabled(): Promise<boolean> {
    try {
      const stripePaymentMethod = await this.paymentMethodsService.getSingle({
        type: EPaymentMethodType.STRIPE,
      });
      return !!stripePaymentMethod && stripePaymentMethod.enabled;
    } catch {
      this.logger.warn('Stripe payment method not found or not active');
      throw new Error('Stripe payment method not found or not active');
    }
  }

  /**
   * Initialize Stripe with configuration
   */
  private initializeStripe() {
    try {
      this.logger.log('Initializing Stripe service...');

      const stripeConfig = this.configService.get('stripe') as {
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
        'Stripe is not configured. Please configure Stripe in Payment Methods settings or install stripe package.',
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
