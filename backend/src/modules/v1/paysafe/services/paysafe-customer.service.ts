import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { User } from '@/common/base-user/entities/user.entity';
import { PaysafeService } from './paysafe.service';
import { PaysafeCustomer } from '../entities/paysafe-customer.entity';
import { LoggerService } from '@/common/logger/logger.service';

type PaysafePaymentHandle = {
  paymentHandleToken: string;
  status?: string;
  paymentType?: string;
  card?: {
    cardType?: string;
    lastDigits?: string;
    cardExpiry?: { month?: string; year?: string };
  };
};

@Injectable()
export class PaysafeCustomerService {
  private readonly logger = new LoggerService(PaysafeCustomerService.name);

  constructor(
    private readonly entityRouterService: EntityRouterService,
    private readonly paysafeService: PaysafeService,
  ) {}

  async createOrGetCustomer(user: User, tenantId?: string): Promise<PaysafeCustomer> {
    const repo = this.entityRouterService.getRepository<PaysafeCustomer>(PaysafeCustomer, tenantId);

    const existing = await repo.findOne({ where: { userId: user.id } });
    if (existing) return existing;

    const merchantCustomerId = tenantId ? `${tenantId}:${user.id}` : String(user.id);

    const created = await this.paysafeService.createCustomer({
      firstName: user.firstName ?? 'User',
      lastName: user.lastName ?? '',
      email: user.email,
      merchantCustomerId,
    });

    if (!created?.id) {
      throw new BadRequestException('Paysafe did not return customer id');
    }

    return repo.save({
      userId: user.id,
      paysafeCustomerId: created.id,
      merchantCustomerId,
      defaultPaymentHandleToken: null,
    });
  }

  async getCustomerCards(user: User, tenantId?: string): Promise<{
    paymentMethods: Array<{
      id: string;
      card?: { brand: string; last4: string; exp_month: number; exp_year: number };
      billing_details?: { name?: string | null; email?: string | null };
      created: number;
    }>;
    defaultPaymentMethodId: string | null;
  }> {
    const repo = this.entityRouterService.getRepository<PaysafeCustomer>(PaysafeCustomer, tenantId);
    const customer = await this.createOrGetCustomer(user, tenantId);

    const handles = await this.paysafeService.getCustomerPaymentHandles(customer.paysafeCustomerId);
    const paymentHandles: PaysafePaymentHandle[] = Array.isArray((handles as any)?.paymentHandles)
      ? (handles as any).paymentHandles
      : Array.isArray(handles as any)
        ? (handles as any)
        : [];

    const paymentMethods = paymentHandles
      .filter((h) => typeof h?.paymentHandleToken === 'string')
      .map((h) => {
        const brand = h.card?.cardType ?? 'card';
        const last4 = h.card?.lastDigits ?? '0000';
        const expMonth = Number(h.card?.cardExpiry?.month ?? 12);
        const expYear = Number(h.card?.cardExpiry?.year ?? new Date().getFullYear());
        return {
          id: h.paymentHandleToken,
          card: {
            brand,
            last4,
            exp_month: expMonth,
            exp_year: expYear,
          },
          billing_details: {
            name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null,
            email: user.email ?? null,
          },
          created: Date.now(),
        };
      });

    const defaultPaymentMethodId = customer.defaultPaymentHandleToken ?? null;

    // Ensure default still exists
    const hasDefault = defaultPaymentMethodId
      ? paymentMethods.some((pm) => pm.id === defaultPaymentMethodId)
      : false;
    if (!hasDefault && defaultPaymentMethodId) {
      customer.defaultPaymentHandleToken = null;
      await repo.save(customer);
      return { paymentMethods, defaultPaymentMethodId: null };
    }

    return { paymentMethods, defaultPaymentMethodId };
  }

  async addCardFromSingleUseToken(
    user: User,
    paymentHandleTokenFrom: string,
    setAsDefault: boolean,
    tenantId?: string,
  ): Promise<{ message: string; paymentHandleToken: string }> {
    if (!paymentHandleTokenFrom) {
      throw new BadRequestException('paymentHandleToken is required');
    }

    const repo = this.entityRouterService.getRepository<PaysafeCustomer>(PaysafeCustomer, tenantId);
    const customer = await this.createOrGetCustomer(user, tenantId);

    const created = await this.paysafeService.createPaymentHandleForCustomer(
      customer.paysafeCustomerId,
      paymentHandleTokenFrom,
    );

    const token = (created as any)?.paymentHandleToken as string | undefined;
    if (!token) {
      this.logger.error('Paysafe did not return multi-use payment handle token', created as any);
      throw new BadRequestException('Paysafe did not return saved card token');
    }

    if (setAsDefault || !customer.defaultPaymentHandleToken) {
      customer.defaultPaymentHandleToken = token;
      await repo.save(customer);
    }

    return { message: 'Payment method added successfully', paymentHandleToken: token };
  }

  /**
   * Adapter-friendly helper: save card using paysafeCustomerId (no User needed).
   */
  async addCardForCustomerId(params: {
    paysafeCustomerId: string;
    paymentHandleTokenFrom: string;
    setAsDefault: boolean;
    tenantId?: string;
  }): Promise<{ paymentHandleToken: string }> {
    const { paysafeCustomerId, paymentHandleTokenFrom, setAsDefault, tenantId } = params;
    if (!paymentHandleTokenFrom) {
      throw new BadRequestException('paymentHandleToken is required');
    }
    const repo = this.entityRouterService.getRepository<PaysafeCustomer>(PaysafeCustomer, tenantId);
    const customer = await repo.findOne({ where: { paysafeCustomerId } });
    if (!customer) {
      throw new NotFoundException('Paysafe customer not found');
    }

    const created = await this.paysafeService.createPaymentHandleForCustomer(
      customer.paysafeCustomerId,
      paymentHandleTokenFrom,
    );
    const token = (created as any)?.paymentHandleToken as string | undefined;
    if (!token) {
      this.logger.error('Paysafe did not return multi-use payment handle token', created as any);
      throw new BadRequestException('Paysafe did not return saved card token');
    }

    if (setAsDefault || !customer.defaultPaymentHandleToken) {
      customer.defaultPaymentHandleToken = token;
      await repo.save(customer);
    }

    return { paymentHandleToken: token };
  }

  async setDefaultCard(
    user: User,
    paymentHandleToken: string,
    tenantId?: string,
  ): Promise<void> {
    const repo = this.entityRouterService.getRepository<PaysafeCustomer>(PaysafeCustomer, tenantId);
    const customer = await this.createOrGetCustomer(user, tenantId);
    customer.defaultPaymentHandleToken = paymentHandleToken;
    await repo.save(customer);
  }

  async deleteCard(
    user: User,
    paymentHandleToken: string,
    tenantId?: string,
  ): Promise<{ message: string }> {
    const repo = this.entityRouterService.getRepository<PaysafeCustomer>(PaysafeCustomer, tenantId);
    const customer = await this.createOrGetCustomer(user, tenantId);

    await this.paysafeService.deleteCustomerPaymentHandle(customer.paysafeCustomerId, paymentHandleToken);

    if (customer.defaultPaymentHandleToken === paymentHandleToken) {
      customer.defaultPaymentHandleToken = null;
      await repo.save(customer);
    }

    return { message: 'Payment method deleted successfully' };
  }

  async getDefaultPaymentMethod(
    user: User,
    tenantId?: string,
  ): Promise<{
    id: string;
    card?: { brand: string; last4: string; exp_month: number; exp_year: number };
    billing_details?: { name?: string | null; email?: string | null };
    created: number;
  } | null> {
    const { paymentMethods, defaultPaymentMethodId } = await this.getCustomerCards(
      user,
      tenantId,
    );
    if (!defaultPaymentMethodId) return null;
    return paymentMethods.find((pm) => pm.id === defaultPaymentMethodId) ?? null;
  }

  async getUserDefaultPaymentMethod(
    user: User,
    tenantId?: string,
  ): Promise<{
    id: string;
    card?: { brand: string; last4: string; exp_month: number; exp_year: number };
    billing_details?: { name?: string | null; email?: string | null };
    created: number;
  } | null> {
    return this.getDefaultPaymentMethod(user, tenantId);
  }
}

