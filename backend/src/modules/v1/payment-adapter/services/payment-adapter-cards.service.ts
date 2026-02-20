import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RequestContext } from '@/common/context/request-context';
import { User } from '@/common/base-user/entities/user.entity';
import { EPaymentProcessorType } from '@shared/enums';
import type { IPaymentCard, IPaymentCardsResponse } from '@shared/interfaces';
import { BusinessService } from '../../business/business.service';
import { StripeCustomerService } from '../../stripe/services/stripe-customer.service';
import { PaysafeCustomerService } from '../../paysafe/services/paysafe-customer.service';
import { UsersService } from '../../users/users.service';
import { LoggerService } from '@/common/logger/logger.service';
import Stripe from 'stripe';

/**
 * Unified payment cards API: delegates to Stripe or Paysafe based on tenant's payment processor.
 * Used by PaymentAdapterCardsController so frontend calls a single /payment-adapter/cards API.
 */
@Injectable()
export class PaymentAdapterCardsService {
  private readonly logger = new LoggerService(PaymentAdapterCardsService.name);

  constructor(
    private readonly businessService: BusinessService,
    private readonly stripeCustomerService: StripeCustomerService,
    private readonly paysafeCustomerService: PaysafeCustomerService,
    private readonly usersService: UsersService,
  ) { }

  private async getProcessorType(user: User, tenantId?: string): Promise<EPaymentProcessorType> {
    let type: EPaymentProcessorType = EPaymentProcessorType.STRIPE;

    if (tenantId || tenantId !== undefined || user) {
      const business = await this.businessService.getSingle(
        { ...(tenantId ? { tenantId } : { userId: user.id }) },
        { _relations: ['paymentProcessor'] },
      );
      if (!business?.paymentProcessor) {
        throw new BadRequestException(
          'Business has no payment processor configured. Please set one in Settings.',
        );
      }
      type = business.paymentProcessor.type;
      if (type !== EPaymentProcessorType.STRIPE && type !== EPaymentProcessorType.PAYSAFE) {
        this.logger.warn(`Unknown processor type ${type}, defaulting to Stripe`);
        type = EPaymentProcessorType.STRIPE;
      }
    }
    return type;
  }

  async getCustomerCards(user: User): Promise<IPaymentCardsResponse> {
    const tenantId = RequestContext.get<string>('tenantId');
    const type = await this.getProcessorType(user, tenantId);
    if (type === EPaymentProcessorType.STRIPE) {
      const raw = await this.stripeCustomerService.getCustomerCards(user, tenantId);
      return this.mapStripePaymentMethodsToPaymentCards(raw);
    }
    return this.paysafeCustomerService.getCustomerCards(user, tenantId) as Promise<IPaymentCardsResponse>;
  }

  private mapStripePaymentMethodsToPaymentCards(raw: {
    paymentMethods: Stripe.PaymentMethod[];
    defaultPaymentMethodId: string | null;
  }): IPaymentCardsResponse {
    const paymentMethods: IPaymentCard[] = raw.paymentMethods.map((pm) => ({
      id: pm.id,
      card: pm.card
        ? {
            brand: pm.card.brand ?? 'card',
            last4: pm.card.last4 ?? '0000',
            exp_month: pm.card.exp_month ?? 12,
            exp_year: pm.card.exp_year ?? new Date().getFullYear(),
            funding: pm.card.funding ?? undefined,
          }
        : undefined,
      billing_details: pm.billing_details
        ? {
            name: pm.billing_details.name ?? null,
            email: pm.billing_details.email ?? null,
          }
        : undefined,
      created: typeof pm.created === 'number' ? pm.created : Date.now(),
    }));
    return {
      paymentMethods,
      defaultPaymentMethodId: raw.defaultPaymentMethodId,
    };
  }

  async addPaymentMethod(
    user: User,
    paymentMethodId: string,
    setAsDefault: boolean,
  ): Promise<{ message: string }> {
    const tenantId = RequestContext.get<string>('tenantId');
    const type = await this.getProcessorType(user, tenantId);
    if (type === EPaymentProcessorType.STRIPE) {
      await this.stripeCustomerService.addPaymentMethod(
        user,
        paymentMethodId,
        setAsDefault,
        tenantId,
      );
    } else {
      await this.paysafeCustomerService.addCardFromSingleUseToken(
        user,
        paymentMethodId,
        setAsDefault,
        tenantId,
      );
    }
    return { message: 'Payment method added successfully' };
  }

  async getDefaultPaymentMethod(user: User, tenantId?: string) {
    const type = await this.getProcessorType(user, tenantId);
    if (type === EPaymentProcessorType.STRIPE) {
      return this.stripeCustomerService.getDefaultPaymentMethod(user, tenantId);
    }
    return this.paysafeCustomerService.getDefaultPaymentMethod(user, tenantId);
  }

  async getUserDefaultPaymentMethod(userId: string) {
    const user = await this.usersService.getUser(userId);
    if (!user) throw new NotFoundException('User not found');
    return this.getDefaultPaymentMethod(user);
  }

  async setDefaultPaymentMethod(user: User, paymentMethodId: string): Promise<{ message: string }> {
    const tenantId = RequestContext.get<string>('tenantId');
    const type = await this.getProcessorType(user, tenantId);
    if (type === EPaymentProcessorType.STRIPE) {
      await this.stripeCustomerService.setDefaultPaymentMethod(user, paymentMethodId, tenantId);
    } else {
      await this.paysafeCustomerService.setDefaultCard(user, paymentMethodId, tenantId);
    }
    return { message: 'Default payment method set successfully' };
  }

  async deletePaymentMethod(user: User, paymentMethodId: string): Promise<{ message: string }> {
    const tenantId = RequestContext.get<string>('tenantId');
    const type = await this.getProcessorType(user, tenantId);
    if (type === EPaymentProcessorType.STRIPE) {
      return this.stripeCustomerService.deletePaymentMethod(user, paymentMethodId, tenantId);
    }
    return this.paysafeCustomerService.deleteCard(user, paymentMethodId, tenantId);
  }
}
