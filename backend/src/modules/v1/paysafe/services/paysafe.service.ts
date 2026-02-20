/**
 * Paysafe Payments API integration.
 * Required env: PAYSAFE_API_USERNAME, PAYSAFE_API_PASSWORD (server-to-server API key).
 * Optional: PAYSAFE_ENVIRONMENT=TEST|LIVE (default TEST), PAYSAFE_SINGLE_USE_TOKEN (Base64 single-use key for Paysafe.js).
 */
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@/common/logger/logger.service';

export interface PaysafeProcessPaymentParams {
  amount: number; // minor units (cents)
  currencyCode: string;
  paymentHandleToken: string;
  merchantRefNum: string;
  description?: string;
  settleWithAuth?: boolean;
}

export interface PaysafePaymentResponse {
  id: string;
  status: string;
  amount: number;
  currencyCode: string;
  merchantRefNum: string;
  paymentHandleToken: string;
  card?: {
    lastDigits?: string;
    cardType?: string;
    cardExpiry?: { month?: string; year?: string };
  };
  gatewayResponse?: {
    description?: string;
    responseCode?: string;
  };
}

@Injectable()
export class PaysafeService {
  private readonly logger = new LoggerService(PaysafeService.name);

  constructor(private readonly configService: ConfigService) {}

  private getPaysafeConfig() {
    const config = this.configService.get<{
      apiUsername: string;
      apiPassword: string;
      environment: string;
      baseUrl: string;
      singleUseToken?: string;
    }>('paymentProcessors.paysafe');
    if (!config?.apiUsername || !config?.apiPassword) {
      this.logger.warn('Paysafe API credentials not configured');
      throw new BadRequestException('Paysafe is not configured. Please set PAYSAFE_API_USERNAME and PAYSAFE_API_PASSWORD.');
    }
    return config;
  }

  private getBaseUrl(): string {
    return this.getPaysafeConfig().baseUrl;
  }

  private getAuthHeader(): string {
    const { apiUsername, apiPassword } = this.getPaysafeConfig();
    const encoded = Buffer.from(`${apiUsername}:${apiPassword}`, 'utf-8').toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Process a payment using a single-use payment handle token from Paysafe.js.
   * POST /paymenthub/v1/payments
   */
  async processPayment(params: PaysafeProcessPaymentParams): Promise<PaysafePaymentResponse> {
    const {
      amount,
      currencyCode = 'USD',
      paymentHandleToken,
      merchantRefNum,
      description = 'Payment',
      settleWithAuth = true,
    } = params;

    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/paymenthub/v1/payments`;

    const body = {
      merchantRefNum,
      amount,
      currencyCode,
      settleWithAuth,
      paymentHandleToken,
      description,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as PaysafePaymentResponse & {
        error?: { code?: string; message?: string };
        message?: string;
      };

      if (!response.ok) {
        const message =
          data?.error?.message ??
          (typeof data?.message === 'string' ? data.message : null) ??
          `Paysafe API error: ${response.status}`;
        this.logger.error(`Paysafe processPayment failed: ${message}`);
        throw new BadRequestException(message);
      }

      if (data.error) {
        throw new BadRequestException(data.error.message ?? 'Paysafe payment failed');
      }

      return data;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Paysafe processPayment error: ${message}`);
      throw new BadRequestException(`Payment failed: ${message}`);
    }
  }

  /**
   * Get single-use token API key for Paysafe.js (frontend).
   * This key is safe to expose to the client for tokenization only.
   */
  getSingleUseTokenApiKey(): string | null {
    const config = this.configService.get<{ singleUseToken?: string }>('paymentProcessors.paysafe');
    return config?.singleUseToken ?? null;
  }

  getEnvironment(): 'TEST' | 'LIVE' {
    const config = this.configService.get<{ environment: string }>('paymentProcessors.paysafe');
    const env = config?.environment ?? 'TEST';
    return env === 'LIVE' ? 'LIVE' : 'TEST';
  }

  /**
   * Create a Paysafe customer (required for saved cards).
   * POST /paymenthub/v1/customers
   * @see https://developer.paysafe.com/en/api-docs/paysafe-js/saved-cards-integration
   */
  async createCustomer(params: {
    firstName: string;
    lastName: string;
    email?: string;
    merchantCustomerId: string;
  }): Promise<{ id: string; status?: string }> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/paymenthub/v1/customers`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify({
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        merchantCustomerId: params.merchantCustomerId,
      }),
    });

    const data = (await response.json()) as any;
    if (!response.ok) {
      const msg =
        data?.error?.message ??
        (typeof data?.message === 'string' ? data.message : null) ??
        `Paysafe create customer failed: ${response.status}`;
      throw new BadRequestException(msg);
    }
    return data as { id: string; status?: string };
  }

  /**
   * Save a card to a customer profile (creates a permanent multi-use paymentHandleToken).
   * POST /paymenthub/v1/customers/{id}/paymenthandles
   */
  async createPaymentHandleForCustomer(
    customerId: string,
    paymentHandleTokenFrom: string,
  ): Promise<{ paymentHandleToken: string; status?: string; card?: any }> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/paymenthub/v1/customers/${customerId}/paymenthandles`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.getAuthHeader(),
      },
      body: JSON.stringify({
        paymentHandleTokenFrom,
      }),
    });

    const data = (await response.json()) as any;
    if (!response.ok) {
      const msg =
        data?.error?.message ??
        (typeof data?.message === 'string' ? data.message : null) ??
        `Paysafe save card failed: ${response.status}`;
      throw new BadRequestException(msg);
    }
    return data as { paymentHandleToken: string; status?: string; card?: any };
  }

  /**
   * List a customer's saved cards (payment handles).
   * GET /paymenthub/v1/customers/{id}/paymenthandles
   */
  async getCustomerPaymentHandles(customerId: string): Promise<any> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/paymenthub/v1/customers/${customerId}/paymenthandles`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: this.getAuthHeader(),
      },
    });
    const data = (await response.json()) as any;
    if (!response.ok) {
      const msg =
        data?.error?.message ??
        (typeof data?.message === 'string' ? data.message : null) ??
        `Paysafe get cards failed: ${response.status}`;
      throw new BadRequestException(msg);
    }
    return data;
  }

  /**
   * Delete a saved payment handle from a customer profile.
   * DELETE /paymenthub/v1/customers/{id}/paymenthandles/{paymentHandleToken}
   */
  async deleteCustomerPaymentHandle(customerId: string, paymentHandleToken: string): Promise<void> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/paymenthub/v1/customers/${customerId}/paymenthandles/${paymentHandleToken}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: this.getAuthHeader(),
      },
    });
    if (!response.ok) {
      let data: any = null;
      try {
        data = await response.json();
      } catch {}
      const msg =
        data?.error?.message ??
        (typeof data?.message === 'string' ? data.message : null) ??
        `Paysafe delete card failed: ${response.status}`;
      throw new BadRequestException(msg);
    }
  }
}
