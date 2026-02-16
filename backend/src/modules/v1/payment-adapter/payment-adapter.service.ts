import { Injectable, BadRequestException } from '@nestjs/common';
import { EPaymentProcessorType } from '@shared/enums';
import { StripePaymentAdapter } from './adapters/stripe-payment.adapter';
import { PaysafePaymentAdapter } from './adapters/paysafe-payment.adapter';
import type { IPaymentAdapter } from './interfaces/payment-adapter.interface';
import { BusinessService } from '../business/business.service';
import { PaymentProcessorsService } from '@/common/payment-processors/payment-processors.service';
import { LoggerService } from '@/common/logger/logger.service';

/**
 * Resolves the payment adapter for a tenant/business.
 * Each business has a payment processor (Stripe or Paysafe); we return the matching adapter.
 */
@Injectable()
export class PaymentAdapterService {
  private readonly logger = new LoggerService(PaymentAdapterService.name);

  constructor(
    private readonly businessService: BusinessService,
    private readonly paymentProcessorsService: PaymentProcessorsService,
    private readonly stripePaymentAdapter: StripePaymentAdapter,
    private readonly paysafePaymentAdapter: PaysafePaymentAdapter,
  ) {}

  /**
   * Get the payment adapter for the given tenant (business).
   * Uses business.paymentProcessorId to determine Stripe vs Paysafe.
   */
  async getAdapterForTenant(tenantId: string): Promise<IPaymentAdapter> {
    const business = await this.businessService.getSingle(
      { tenantId },
      { _relations: ['paymentProcessor'] },
    );

    if (!business) {
      this.logger.warn(`No business found for tenantId ${tenantId}`);
      throw new BadRequestException('Business not found for this tenant');
    }

    const processor = business.paymentProcessor;
    if (!processor) {
      this.logger.warn(`Business ${business.id} has no payment processor set`);
      throw new BadRequestException(
        'Business has no payment processor configured. Please set one in Settings → Payment processor.',
      );
    }

    switch (processor.type) {
      case EPaymentProcessorType.STRIPE:
        return this.stripePaymentAdapter;
      case EPaymentProcessorType.PAYSAFE:
        return this.paysafePaymentAdapter;
      default:
        this.logger.warn(
          `Unknown payment processor type ${processor.type}; defaulting to Stripe`,
        );
        return this.stripePaymentAdapter;
    }
  }

  /**
   * Ensure the business for the given tenant has a payment processor configured.
   * Use before creating billing in tenant context so payments can be processed.
   * @throws BadRequestException if no business or no payment processor
   */
  async assertBusinessHasPaymentProcessor(tenantId: string): Promise<void> {
    const business = await this.businessService.getSingle(
      { tenantId },
      { _relations: ['paymentProcessor'] },
    );
    if (!business) {
      this.logger.warn(`No business found for tenantId ${tenantId}`);
      throw new BadRequestException('Business not found for this tenant');
    }
    if (!business.paymentProcessorId || !business.paymentProcessor) {
      this.logger.warn(`Business ${business.id} has no payment processor set`);
      throw new BadRequestException(
        'Business has no payment processor configured. Please set one in Settings → Payment processor before creating billings.',
      );
    }
  }

  /**
   * Get the payment adapter for a business by business ID.
   */
  async getAdapterForBusiness(businessId: string): Promise<IPaymentAdapter> {
    const business = await this.businessService.getSingle(businessId, {
      _relations: ['paymentProcessor'],
    });

    if (!business) {
      throw new BadRequestException('Business not found');
    }

    if (!business.tenantId) {
      throw new BadRequestException('Business has no tenant');
    }

    return this.getAdapterForTenant(business.tenantId);
  }
}
