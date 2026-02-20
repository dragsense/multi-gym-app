import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '@/common/base-user/entities/user.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { PaysafeService } from '../../paysafe/services/paysafe.service';
import { PaysafeCustomerService } from '../../paysafe/services/paysafe-customer.service';
import type {
  IPaymentAdapter,
  PaymentCustomerResult,
  PaymentCardInfo,
  PaymentIntentResult,
} from '../interfaces/payment-adapter.interface';

/**
 * Paysafe implementation of the payment adapter.
 * Frontend: Paysafe.js hosted fields (PCI-compliant, card data never touches our server).
 * Backend: Paysafe Payments API - process payment with single-use payment handle token.
 * MVP: No customer vault; each payment uses a fresh token from Paysafe.js tokenize().
 */
@Injectable()
export class PaysafePaymentAdapter implements IPaymentAdapter {
  private readonly logger = new LoggerService(PaysafePaymentAdapter.name);

  constructor(
    private readonly paysafeService: PaysafeService,
    private readonly paysafeCustomerService: PaysafeCustomerService,
  ) {}

  async createOrGetCustomer(
    user: User,
    tenantId?: string,
  ): Promise<PaymentCustomerResult> {
    const customer = await this.paysafeCustomerService.createOrGetCustomer(
      user,
      tenantId,
    );
    return {
      customerId: customer.paysafeCustomerId,
      metadata: { paysafeCustomerId: customer.paysafeCustomerId },
    };
  }

  async createPaymentIntent(params: {
    amountCents: number;
    customerId: string;
    paymentMethodId: string;
    currency?: string;
    confirm?: boolean;
    metadata?: Record<string, string>;
    tenantId?: string;
    applicationFeeAmount?: number;
  }): Promise<PaymentIntentResult> {
    const {
      amountCents,
      paymentMethodId,
      metadata,
      currency = 'USD',
    } = params;

    const merchantRefNum = metadata?.billingId ?? metadata?.merchantRefNum ?? `pay-${Date.now()}`;

    const payment = await this.paysafeService.processPayment({
      amount: amountCents,
      currencyCode: currency.toUpperCase(),
      paymentHandleToken: paymentMethodId,
      merchantRefNum,
      description: metadata?.description ?? 'Payment',
      settleWithAuth: true,
    });

    const status = payment.status === 'COMPLETED' ? 'succeeded' : payment.status;

    return {
      id: payment.id,
      status,
      metadata: {
        paysafeId: payment.id,
        merchantRefNum: payment.merchantRefNum,
        cardLast4: payment.card?.lastDigits,
        cardType: payment.card?.cardType,
      },
    };
  }

  async getCardInfoFromPaymentMethod(
    _paymentMethodId: string,
    _tenantId?: string,
  ): Promise<PaymentCardInfo | null> {
    // With single-use token we don't have card details until after payment.
    // Return a placeholder so billing service doesn't throw; real card info is in createPaymentIntent response.
    return {
      last4: '****',
      brand: 'Card',
    };
  }

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string,
    setAsDefault: boolean,
    tenantId?: string,
  ): Promise<void> {
    // Convert single-use token into a permanent multi-use paymentHandleToken saved on the customer
    await this.paysafeCustomerService.addCardForCustomerId({
      paysafeCustomerId: customerId,
      paymentHandleTokenFrom: paymentMethodId,
      setAsDefault,
      tenantId,
    });
    this.logger.debug('Paysafe card saved to customer profile');
  }
}
