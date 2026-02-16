import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ScheduleService } from '@/common/schedule/schedule.service';
import { EventPayload } from '@/common/helper/services/event.service';
import {
  EScheduleFrequency,
} from '@shared/enums/schedule.enum';
import { BusinessSubscriptionService } from './business-subscription.service';
import { BusinessSubscription } from '../entities/business-subscription.entity';
import { ActionRegistryService } from '@/common/helper/services/action-registry.service';
import { DateTime } from 'luxon';
import { BillingsService } from '@/modules/v1/billings/billings.service';
import { StripeCustomerService } from '@/modules/v1/stripe/services/stripe-customer.service';
import { ESubscriptionFrequency } from '@shared/enums/business/subscription.enum';
import { BusinessSubscriptionBillingService } from './business-subscription-billing.service';
import { EBillingType } from '@shared/enums/billing.enum';

@Injectable()
export class BusinessSubscriptionEventListenerService implements OnModuleInit {
  private readonly logger = new Logger(BusinessSubscriptionEventListenerService.name);

  constructor(
    private readonly businessSubscriptionService: BusinessSubscriptionService,
    private readonly businessSubscriptionBillingService: BusinessSubscriptionBillingService,
    private readonly scheduleService: ScheduleService,
    private readonly actionRegistryService: ActionRegistryService,
    private readonly billingsService: BillingsService,
    private readonly stripeCustomerService: StripeCustomerService,
  ) { }

  onModuleInit() {
    // Register business subscription billing action with action registry
    this.actionRegistryService.registerAction('process-business-subscription-billing', {
      handler: this.handleProcessBusinessSubscriptionBilling.bind(this),
      description: 'Process recurring business subscription billing',
      retryable: true,
      timeout: 30000,
    });
  }

  /**
   * Handle business subscription created event - setup recurring billing schedule
   */
  @OnEvent('businesssubscription.crud.create')
  async handleBusinessSubscriptionCreated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    try {
      const businessSubscription = await this.businessSubscriptionService.getSingle(
        payload.entityId,
        {
          _relations: ['business', 'business.user', 'subscription'],
        },
      );
      if (!businessSubscription) {
        throw new NotFoundException('Business subscription not found');
      }

      this.logger.log(
        `Business subscription created: ${businessSubscription.id} for business ${businessSubscription.businessId}`,
      );

      // Only schedule billing if subscription has frequency
      if (!businessSubscription.subscription?.frequency || businessSubscription.subscription.frequency.length === 0) {
        this.logger.log(
          `Subscription ${businessSubscription.subscriptionId} has no frequency, skipping billing schedule`,
        );
        return;
      }

      // Schedule recurring billing
      await this.scheduleBusinessSubscriptionBilling(businessSubscription);
    } catch (error) {
      this.logger.error(
        `Failed to handle business subscription creation for ${payload.entityId}:`,
        error,
      );
    }
  }

  /**
   * Schedule recurring business subscription billing based on frequency
   */
  private async scheduleBusinessSubscriptionBilling(
    businessSubscription: BusinessSubscription,
  ): Promise<void> {
    try {
      const subscription = businessSubscription.subscription;
      if (!subscription) {
        return;
      }


      const businessSubscriptionBilling = await this.businessSubscriptionBillingService.getSingle({
        businessSubscription: { id: businessSubscription.id },
      }, {
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      // Get frequency from business subscription or latest history entry metadata
      let frequency = businessSubscriptionBilling?.selectedFrequency || ESubscriptionFrequency.MONTHLY; // Default


      const timezone = businessSubscriptionBilling?.timezone || 'UTC';
      const now = DateTime.now().setZone(timezone);

      // Calculate billing start date - start from next billing period
      const billingStartDate = this.calculateNextBillingDate(
        now.toJSDate(),
        frequency,
      );

      // Calculate end date based on subscription (if it has expiry)
      // For now, we'll schedule indefinitely until subscription is cancelled
      let endDate: Date | undefined;

      // Map subscription frequency to schedule frequency
      const scheduleFrequency = this.mapSubscriptionFrequencyToScheduleFrequency(
        frequency,
      );

      // Get billing start day for monthly schedules (default to 1st of month)
      const monthDays = [1]; // Default to 1st of each month

      // For WEEKLY frequency, we need to provide weekDays
      let weekDays: number[] | undefined;
      if (scheduleFrequency === EScheduleFrequency.WEEKLY) {
        const startDate = DateTime.fromJSDate(billingStartDate).setZone(timezone);
        const dayOfWeek = startDate.weekday; // Luxon: 1 = Monday, 7 = Sunday
        // Convert to EDayOfWeek format: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const scheduleDayOfWeek = dayOfWeek === 7 ? 0 : dayOfWeek;
        weekDays = [scheduleDayOfWeek];
      }

      // Create recurring schedule
      await this.scheduleService.createSchedule({
        title: `Business Subscription Billing - ${subscription.title}`,
        description: `Recurring billing for business subscription ${subscription.title}`,
        action: 'process-business-subscription-billing',
        entityId: businessSubscription.id,
        frequency: scheduleFrequency,
        weekDays,
        monthDays,
        startDate: billingStartDate.toISOString(),
        endDate: endDate?.toISOString(),
        timeOfDay: '00:00',
        timezone: timezone,
        retryOnFailure: true,
        data: {
          businessSubscriptionId: businessSubscription.id,
          businessId: businessSubscription.businessId,
          subscriptionId: subscription.id,
          frequency: frequency, // Store the actual frequency used
          lastBillingDate: billingStartDate.toISOString(),
        },
      });

      this.logger.log(
        `Scheduled recurring billing for business subscription ${subscription.title} starting from ${billingStartDate.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule billing for business subscription ${businessSubscription.id}:`,
        error,
      );
    }
  }

  /**
   * Calculate next billing date based on frequency
   */
  private calculateNextBillingDate(
    startDate: Date,
    frequency: ESubscriptionFrequency,
  ): Date {
    const start = DateTime.fromJSDate(startDate);
    let nextDate: DateTime;

    switch (frequency) {
      case ESubscriptionFrequency.WEEKLY:
        nextDate = start.plus({ weeks: 1 });
        break;
      case ESubscriptionFrequency.MONTHLY:
        nextDate = start.plus({ months: 1 });
        break;
      case ESubscriptionFrequency.YEARLY:
        nextDate = start.plus({ years: 1 });
        break;
      default:
        nextDate = start.plus({ months: 1 });
    }

    return nextDate.toJSDate();
  }

  /**
   * Map subscription frequency to schedule frequency
   */
  private mapSubscriptionFrequencyToScheduleFrequency(
    frequency: ESubscriptionFrequency,
  ): EScheduleFrequency {
    switch (frequency) {
      case ESubscriptionFrequency.WEEKLY:
        return EScheduleFrequency.WEEKLY;
      case ESubscriptionFrequency.MONTHLY:
        return EScheduleFrequency.MONTHLY;
      case ESubscriptionFrequency.YEARLY:
        return EScheduleFrequency.YEARLY;
      default:
        return EScheduleFrequency.MONTHLY;
    }
  }

  /**
   * Handle process business subscription billing action
   */
  private async handleProcessBusinessSubscriptionBilling(
    data: {
      businessSubscriptionId: string;
      businessId: string;
      subscriptionId: string;
      lastBillingDate?: string;
    },
  ): Promise<void> {
    const { businessSubscriptionId, businessId, subscriptionId } = data;

    try {
      // Get business subscription with relations
      const businessSubscription = await this.businessSubscriptionService.getSingle(
        businessSubscriptionId,
        {
          _relations: ['business', 'business.user', 'subscription'],
        },
      );

      if (!businessSubscription) {
        throw new NotFoundException('Business subscription not found');
      }

      // Check if subscription is still active
      if (!businessSubscription.isActive) {
        this.logger.log(
          `Business subscription ${businessSubscriptionId} is not active, skipping billing`,
        );
        return;
      }

      const business = businessSubscription.business;
      if (!business || !business.user) {
        throw new NotFoundException('Business or user not found');
      }

      const subscription = businessSubscription.subscription;
      if (!subscription || subscription.status !== 'active') {
        this.logger.log(
          `Subscription ${subscriptionId} is not active, skipping billing`,
        );
        return;
      }

      const businessSubscriptionBilling = await this.businessSubscriptionBillingService.getSingle({
        businessSubscription: { id: businessSubscription.id },
      }, {
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });




      const frequency = businessSubscriptionBilling?.selectedFrequency ?? ESubscriptionFrequency.MONTHLY;
      const timezone = businessSubscriptionBilling?.timezone ?? 'UTC';
      const now = DateTime.now().setZone(timezone);

      // Calculate amount based on subscription price and frequency
      const price = Number(subscription.price) || 0;
      const discountPercentage = subscription.discountPercentage || 0;

      // Normalize price based on frequency
      const normalizedPrice = this.normalizeSubscriptionPrice(
        price,
        frequency,
        discountPercentage,
      );

      if (normalizedPrice <= 0) {
        this.logger.warn(
          `Invalid subscription price for business ${businessId}, skipping billing`,
        );
        return;
      }

      const issueDate = now.toJSDate();
      const dueDate = now.plus({ days: 7 }).toJSDate();

      const lineItems: Array<{ description: string; quantity: number; unitPrice: number }> = [];
      if (normalizedPrice > 0) {
        lineItems.push({
          description: `${subscription.title} - Subscription Fee (Recurring)`,
          quantity: 1,
          unitPrice: normalizedPrice,
        });
      }

      const { billing: newBilling } = await this.billingsService.createBilling({
        title: `Business Subscription Payment - ${subscription.title} (Recurring)`,
        description: `Recurring payment for ${subscription.title} subscription`,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        recipientUser: { id: business.user.id },
        type: EBillingType.BUSINESS, // Using BUSINESS type for business subscriptions
        lineItems,
      });

      // Link billing to business billing
      await this.businessSubscriptionBillingService.create({
        businessSubscription: { id: businessSubscriptionId },
        billing: { id: newBilling.id },
        selectedFrequency: frequency,
        timezone: timezone,
      });

      if (!businessSubscription.subscription.autoRenewal) {
        this.logger.log(
          `Business subscription ${businessSubscriptionId} is not auto-renewal, creating billing but not processing payment`,
        );
        return;
      }

      // Get default payment method from Stripe customer
      const defaultPaymentMethod = await this.stripeCustomerService.getDefaultPaymentMethod(
        business.user,
      );
      if (!defaultPaymentMethod) {
        this.logger.warn(
          `No default payment method found for business ${businessId}, skipping billing`,
        );
        return;
      }


      // Create payment intent with default payment method
      this.billingsService.createBillingPaymentIntent(
        {
          billingId: newBilling.id,
          paymentMethodId: defaultPaymentMethod.id,
          saveForFutureUse: false,
          setAsDefault: false,
        },
        business.user,
        timezone,
        {
          businessSubscriptionId,
          businessId,
        },
      ).then(() => {
        this.logger.log(
          `Successfully processed recurring billing for business subscription ${businessSubscriptionId}`,
        );
      }).catch((error) => {
        this.logger.error(
          `Failed to process business subscription billing for ${businessSubscriptionId}:`,
          error,
        );

        this.logger.log(
          `Successfully processed recurring billing for business subscription ${businessSubscriptionId}`,
        );
      });
    } catch (error) {
      this.logger.error(
        `Failed to process business subscription billing for ${businessSubscriptionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Normalize subscription price based on frequency
   */
  private normalizeSubscriptionPrice(
    price: number,
    frequency: ESubscriptionFrequency,
    discountPercentage: number = 0,
  ): number {
    // Apply discount
    let normalizedPrice = price;
    if (discountPercentage > 0) {
      normalizedPrice = price * (1 - discountPercentage / 100);
    }

    // Price is already per period, so no need to adjust based on frequency
    // The frequency determines when to bill, not the amount
    return Math.round(normalizedPrice * 100) / 100;
  }
}
