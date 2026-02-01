import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { BusinessSubscriptionBilling } from '../entities/business-susbscription-billing.entity';

import { User } from '@/common/base-user/entities/user.entity';
import { BusinessService } from '../business.service';
import { LoggerService } from '@/common/logger/logger.service';
import { IMessageResponse } from '@shared/interfaces';
import { StripeBillingService } from '@/modules/v1/stripe/services/stripe-billing.service';
import { StripeCustomerService } from '@/modules/v1/stripe/services/stripe-customer.service';
import { BusinessSubscriptionPaymentIntentDto, CreateBusinessSubscriptionDto, CreateBusinessSubscriptionPaymentIntentDto } from '@shared/dtos/business-dtos';
import { BillingsService } from '../../billings/billings.service';
import { CrudService } from '@/common/crud/crud.service';
import { EntityManager, Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { EBillingStatus, EBillingType } from '@shared/enums/billing.enum';
import { DateTime } from 'luxon';
import { BusinessDto } from '@shared/dtos/business-dtos';
import { Business } from '../entities/business.entity';
import { Billing } from '../../billings/entities/billing.entity';
import { BillingHistoryService } from '../../billings/services/billing-history.service';
import { BillingHistory } from '../../billings/entities/billing-history.entity';
import { generateInvoiceRef } from '../../billings/utils/billing.utils';
import { Profile } from '../../users/profiles/entities/profile.entity';
import { EBusinessStatus } from '@shared/enums';
import { normalizeSubscriptionPrice } from '@/lib/utils/normalize-subscription-price';
import { BusinessSubscriptionService } from './business-subscription.service';
import { BusinessSubscriptionHistoryService } from './business-subscription-history.service';
import { ESubscriptionFrequency, ESubscriptionStatus } from '@shared/enums/business/subscription.enum';
import { BusinessSubscription } from '../entities/business-subscription.entity';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class BusinessSubscriptionBillingService extends CrudService<BusinessSubscriptionBilling> {
  private readonly customLogger = new LoggerService(BusinessSubscriptionBillingService.name);

  constructor(
    @InjectRepository(BusinessSubscriptionBilling)
    private readonly businessSubscriptionBillingRepo: Repository<BusinessSubscriptionBilling>,
    private readonly businessService: BusinessService,
    private readonly businessSubscriptionService: BusinessSubscriptionService,
    private readonly businessSubscriptionHistoryService: BusinessSubscriptionHistoryService,
    private readonly billingsService: BillingsService,
    private readonly stripeBillingService: StripeBillingService,
    private readonly stripeCustomerService: StripeCustomerService,
    private readonly billingHistoryService: BillingHistoryService,
    protected readonly entityRouterService: EntityRouterService,
    moduleRef: ModuleRef,
  ) {
    super(businessSubscriptionBillingRepo, moduleRef);
  }

  async getUserBusinessSubscriptionBillings(userId: string): Promise<BusinessSubscriptionBilling[]> {
    return this.getAll(null, undefined, {
      beforeQuery: (query) => {
        query.innerJoin('entity.user', 'user', 'user.id = :userId', { userId });

        return query;
      },
    });
  }

  async checkUserBusinessSubscriptionPayment(
    userId: string,
    businessSubscriptionId: string,
  ): Promise<{
    hasPaid: boolean;
    paidAt?: Date | null;
  }> {
    const businessSubscriptionBilling = await this.getSingle({
      businessSubscriptionId: businessSubscriptionId,
      userId: userId
    }, {
      _relations: ['billing'],
    });

    if (!businessSubscriptionBilling || !businessSubscriptionBilling.billing) {
      return { hasPaid: false };
    }

    return this.billingsService.checkBillingPayment(businessSubscriptionBilling.billing.id);
  }

  async createBusinessSubscriptionPaymentIntent(
    createBusinessSubscriptionPaymentIntentDto: CreateBusinessSubscriptionPaymentIntentDto,
    currentUser: User,
    timezone: string,
  ): Promise<IMessageResponse> {
    const {
      businessId,
      subscriptionId,
      frequency,
      paymentMethodId,
    } = createBusinessSubscriptionPaymentIntentDto;


    // Create business subscription
    const businessSubscription = await this.businessSubscriptionService.createBusinessSubscription(
      businessId,
      subscriptionId,
      frequency,
      currentUser,
      timezone,
    );


    const { billing } = await this.createPaymentIntent(
      {
        businessSubscriptionId: businessSubscription.id, paymentMethodId,
        saveForFutureUse: true,
        setAsDefault: true,
      },
      currentUser,
      timezone,
    );

    // Check if payment was successful
    const { status } = await this.billingsService.getBillingStatus(billing.id);

    if (status === EBillingStatus.PAID) {

      // Activate business subscription (this will create tenant database)
      await this.businessSubscriptionService.activateBusinessSubscription(
        businessSubscription.id,
        'BUSINESS_SUBSCRIPTION_PAYMENT_INTENT',
        {
          billingId: billing.id,
          businessId: businessId,
        },
      );
    }

    return { message: 'Business subscription and payment intent created successfully' };
  }

  async createPaymentIntent(
    businessSubscriptionPaymentIntentDto: BusinessSubscriptionPaymentIntentDto,
    currentUser: User,
    timezone: string,
  ): Promise<IMessageResponse & { billing: Billing }> {
    const {
      businessSubscriptionId,
      paymentMethodId,
      setAsDefault,
      saveForFutureUse,
    } = businessSubscriptionPaymentIntentDto;

    // Fetch business subscription with relations
    const businessSubscription = await this.businessSubscriptionService.getSingle(
      businessSubscriptionId,
      {
        _relations: ['business', 'business.user', 'subscription'],
      },
    );

    if (!businessSubscription) {
      throw new NotFoundException('Business subscription not found');
    }

    const businessId = businessSubscription.businessId;

    if (!businessSubscription.business?.user) {
      throw new BadRequestException('Business user not found');
    }

    const businessUser = businessSubscription.business.user;

    if (businessUser.id !== currentUser.id) {
      throw new ForbiddenException(
        'You are not authorized to create a payment intent for this business',
      );
    }

    // Get subscription details
    const subscription = businessSubscription.subscription;
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== ESubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Subscription is not active');
    }

    // Get frequency from history metadata or use default
    let frequency = ESubscriptionFrequency.MONTHLY;
    const latestHistory = await this.businessSubscriptionHistoryService.getLatestBusinessSubscriptionHistory(
      businessSubscriptionId,
    );
    if (latestHistory?.metadata?.frequency) {
      frequency = latestHistory.metadata.frequency as ESubscriptionFrequency;
    }

    // Calculate normalized price
    const normalizedPrice = normalizeSubscriptionPrice(
      subscription.price!,
      frequency,
      subscription.discountPercentage,
    );

    if (!normalizedPrice || normalizedPrice < 0) {
      throw new BadRequestException('Invalid subscription amount');
    }

    // Calculate dates
    const now = DateTime.now().setZone(timezone);
    const issueDate = now.toJSDate();
    const dueDate = now.plus({ days: 7 }).toJSDate();

    // Create line items
    const lineItems: Array<{ description: string; quantity: number; unitPrice: number }> = [];
    if (normalizedPrice > 0) {
      lineItems.push({
        description: `${subscription.title} - Subscription Fee`,
        quantity: 1,
        unitPrice: normalizedPrice,
      });
    }



    // Create billing
    const { billing: newBilling } = await this.billingsService.createBilling({
      title: `Business Subscription Payment - ${subscription.title}`,
      description: subscription.description || `Payment for ${subscription.title} subscription`,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      recipientUser: { id: businessUser.id },
      type: EBillingType.BUSINESS,
      lineItems,
    });



    let billing = newBilling;
    let savedBusinessSubscriptionBilling: BusinessSubscriptionBilling | null = null;


    try {
      // Link billing to business subscription
      savedBusinessSubscriptionBilling = await this.create({
        billing: { id: newBilling.id },
        businessSubscription: { id: businessSubscriptionId },
      });


      // Create payment intent
      if (paymentMethodId) {
        await this.billingsService.createBillingPaymentIntent({
          billingId: billing.id,
          paymentMethodId,
          saveForFutureUse,
          setAsDefault,
        }, currentUser, timezone, {
          businessSubscriptionId,
          businessId,
        });
      }
    } catch (error) {
      if (savedBusinessSubscriptionBilling) {
        await this.permanentlyDelete(savedBusinessSubscriptionBilling.id);
      }
      if (billing) {
        await this.billingsService.permanentlyDelete(billing.id);
      }
      throw error;
    }

    return { message: 'Payment intent created successfully', billing };
  }

}