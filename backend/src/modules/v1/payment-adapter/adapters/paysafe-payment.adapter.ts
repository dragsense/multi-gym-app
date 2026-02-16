import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '@/common/base-user/entities/user.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { PaysafeService } from '../services/paysafe.service';
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

  constructor(private readonly paysafeService: PaysafeService) {}

  async createOrGetCustomer(
    _user: User,
    _tenantId?: string,
  ): Promise<PaymentCustomerResult> {
    // Paysafe MVP: we don't use customer vault; single-use token per payment.
    // Return a placeholder so billing flow can call createPaymentIntent.
    return {
      customerId: 'paysafe-single-use',
      metadata: {},
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
    _customerId: string,
    _paymentMethodId: string,
    _setAsDefault: boolean,
    _tenantId?: string,
  ): Promise<void> {
    // MVP: Paysafe single-use tokens are not stored; no-op.
    this.logger.debug('Paysafe attachPaymentMethod no-op (single-use token flow)');
  }
}
