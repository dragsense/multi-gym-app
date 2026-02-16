import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { StripeCustomer } from '../entities/stripe-customer.entity';
import { User } from '@/common/base-user/entities/user.entity';
import { BaseStripeService } from './base-stripe.service';
import { LoggerService } from '@/common/logger/logger.service';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { StripeConnectService } from './stripe-connect.service';
import { StripeConnectAccount } from '../entities/stripe-connect-account.entity';

@Injectable()
export class StripeCustomerService {
  private readonly logger = new LoggerService(StripeCustomerService.name);
  constructor(
    private readonly entityRouterService: EntityRouterService,
    private readonly baseStripeService: BaseStripeService,
    private readonly stripeConnectService: StripeConnectService,
  ) { }

  async createOrGetStripeCustomer(user: User, tenantId?: string): Promise<StripeCustomer> {
    let stripeCustomerRepository = this.entityRouterService.getRepository<StripeCustomer>(StripeCustomer, tenantId);

    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }

    // First, try to find customer by user.id
    let existingCustomer = await stripeCustomerRepository.findOne({
      where: { userId: user.id },
      relations: ['user'],
    });

    const stripe = this.baseStripeService.getStripe();

    if (existingCustomer) {
      try {
        const stripeCustomer = await stripe.customers.retrieve(
          existingCustomer.stripeCustomerId,
          connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);


        if (!stripeCustomer.deleted) {
          // Update local record with latest Stripe data
          await this.updateStripeCustomerData(existingCustomer, stripeCustomer, stripeCustomerRepository);
          return existingCustomer;
        }
      } catch {
        this.logger.error(
          `Stripe customer ${existingCustomer.stripeCustomerId} not found in Stripe. Creating new one.`,
        );
      }
    }

    let stripeCustomer: Stripe.Customer | null = null;


    try {
      stripeCustomer = await stripe.customers.create({
        name: `${user.firstName ?? 'User'} ${user.lastName ?? ''}`,
        email: user.email,
        metadata: {
          userId: user.id.toString(),
        },
      }, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
    } catch (error) {
      this.logger.error(`Failed to create or get Stripe customer: ${error instanceof Error ? error.message : String(error)}`);
      throw new BadRequestException(`Failed to create or get Stripe customer: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!stripeCustomer) {
      throw new BadRequestException('Failed to create or get Stripe customer');
    }

    return await stripeCustomerRepository.save({
      stripeCustomerId: stripeCustomer.id,
      userId: user.id,
      email: stripeCustomer.email || user.email,
      name: stripeCustomer.name || undefined,
      country: stripeCustomer.address?.country || undefined,
      status: stripeCustomer.deleted ? 'deleted' : 'active',
      stripeCreatedAt: new Date(stripeCustomer.created * 1000),
      metadata: stripeCustomer.metadata as Record<string, string>,
    });
  }

  async getStripeCustomer(user: User, tenantId?: string): Promise<{ customer: StripeCustomer, stripeCustomer: Stripe.Customer }> {

    let stripeCustomerRepository = this.entityRouterService.getRepository<StripeCustomer>(StripeCustomer, tenantId);
    let existingCustomer = await stripeCustomerRepository.findOne({
      where: { userId: user.id },
      relations: ['user'],
    });

    if (!existingCustomer) {
      throw new BadRequestException('Customer not found');
    }

    const stripe = this.baseStripeService.getStripe();
    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }
    const customer = await stripe.customers.retrieve(existingCustomer.stripeCustomerId, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
    if (customer.deleted) {
      throw new BadRequestException('Customer has been deleted in Stripe');
    }
    return {
      customer: existingCustomer,
      stripeCustomer: customer,
    };
  }

  async getCustomerInfo(user: User, tenantId?: string): Promise<Stripe.Customer> {
    const { customer } = await this.getStripeCustomer(user, tenantId);
    const stripe = this.baseStripeService.getStripe();

    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }


    const stripeCustomer = await stripe.customers.retrieve(
      customer.stripeCustomerId,
      connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined
    );
    if (stripeCustomer.deleted) {
      throw new BadRequestException('Customer has been deleted in Stripe');
    }
    return stripeCustomer;
  }

  async getCustomerCards(user: User, tenantId?: string): Promise<{ paymentMethods: Stripe.PaymentMethod[], defaultPaymentMethodId: string | null }> {
    const { customer } = await this.getStripeCustomer(user, tenantId);
    const stripe = this.baseStripeService.getStripe();
    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.stripeCustomerId,
      type: 'card',
    }, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
    const defaultPaymentMethod = await this.getDefaultPaymentMethod(user, tenantId);
    return {
      paymentMethods: paymentMethods.data,
      defaultPaymentMethodId: defaultPaymentMethod?.id || null,
    }
  }

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
    setAsDefault: boolean = false,
    tenantId?: string,
  ): Promise<void> {
    const stripe = this.baseStripeService.getStripe();
    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    }, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);

    if (setAsDefault) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      }, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
    }
  }

  async addPaymentMethod(
    user: User,
    paymentMethodId: string,
    setAsDefault: boolean = false,
    tenantId?: string,
  ): Promise<Stripe.PaymentMethod> {
    const { customer } = await this.getStripeCustomer(user, tenantId);
    const stripe = this.baseStripeService.getStripe();

    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }

    // Attach the payment method to the customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.stripeCustomerId,
    }, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);

    // Set as default if requested
    if (setAsDefault) {
      await stripe.customers.update(customer.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      }, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
    }

    return paymentMethod;
  }

  async setDefaultPaymentMethod(user: User, paymentMethodId: string, tenantId?: string): Promise<Stripe.Customer> {
    const { customer } = await this.getStripeCustomer(user, tenantId);
    const stripe = this.baseStripeService.getStripe();

    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
    if (paymentMethod.customer !== customer.stripeCustomerId) {
      throw new BadRequestException('Payment method does not belong to this customer');
    }

    const updatedCustomer = await stripe.customers.update(customer.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    }, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);

    if (updatedCustomer.deleted) {
      throw new BadRequestException('Customer has been deleted in Stripe');
    }

    return updatedCustomer;
  }

  async deletePaymentMethod(user: User, paymentMethodId: string, tenantId?: string): Promise<{ message: string }> {
    const { customer } = await this.getStripeCustomer(user, tenantId);
    const stripe = this.baseStripeService.getStripe();

    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }

    // Verify the payment method belongs to this customer
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
    if (paymentMethod.customer !== customer.stripeCustomerId) {
      throw new BadRequestException('Payment method does not belong to this customer');
    }

    // Check if this is the default payment method
    const stripeCustomer = await stripe.customers.retrieve(customer.stripeCustomerId, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);
    if (!stripeCustomer.deleted) {
      const defaultPaymentMethodId = stripeCustomer.invoice_settings?.default_payment_method;
      if (defaultPaymentMethodId === paymentMethodId) {
        throw new BadRequestException('Cannot delete the default payment method. Please set another card as default first.');
      }
    }

    await stripe.paymentMethods.detach(paymentMethodId);
    return { message: 'Payment method deleted successfully' };
  }

  async getDefaultPaymentMethod(user: User, tenantId?: string): Promise<Stripe.PaymentMethod | null> {
    const { stripeCustomer } = await this.getStripeCustomer(user, tenantId);
    const stripe = this.baseStripeService.getStripe();
    let connectedAccount: StripeConnectAccount | null = null;
    if (tenantId) {
      connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
    }

    const defaultPaymentMethod = stripeCustomer.invoice_settings?.default_payment_method;
    if (typeof defaultPaymentMethod === 'string') {
      return await stripe.paymentMethods.retrieve(defaultPaymentMethod, connectedAccount ? { stripeAccount: connectedAccount.stripeAccountId } : undefined);
    }
    return null;
  }

  /**
   * Get card information from a payment method ID
   * Returns card details like brand, last4, expMonth, expYear
   */
  async getCardInfoFromPaymentMethod(paymentMethodId: string, tenantId?: string): Promise<{
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null> {
    try {
      const stripe = this.baseStripeService.getStripe();
      let connectedAccount: StripeConnectAccount | null = null;
      if (tenantId) {
        connectedAccount = await this.stripeConnectService.findByTenantId(tenantId);
      }
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId, connectedAccount ? { stripeAccount: connectedAccount?.stripeAccountId } : undefined);

      if (paymentMethod.card) {
        return {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          expMonth: paymentMethod.card.exp_month,
          expYear: paymentMethod.card.exp_year,
        };
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to retrieve payment method details for ${paymentMethodId}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private async updateStripeCustomerData(
    localCustomer: StripeCustomer,
    stripeCustomer: Stripe.Customer,
    _stripeCustomerRepository: Repository<StripeCustomer>,
  ): Promise<void> {
    const updated: Partial<StripeCustomer> = {
      ...localCustomer,
      email: stripeCustomer.email || localCustomer.email || undefined,
      name: stripeCustomer.name || undefined,
      country: stripeCustomer.address?.country || undefined,
      status: stripeCustomer.deleted ? 'deleted' : 'active',
      metadata: stripeCustomer.metadata as Record<string, string>,
    };

    await _stripeCustomerRepository.save(updated as StripeCustomer);
  }
}
