import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { RequestContext } from '@/common/context/request-context';
import { ModuleRef } from '@nestjs/core';
import { Billing } from './entities/billing.entity';
import {
  CreateBillingDto,
  UpdateBillingDto,
  BillingPaymentIntentDto,
  CreateBillingLineItemDto,
  UpdateBillingNotesDto,
  UpdateBillingStatusDto,
} from '@shared/dtos';
import { IMessageResponse } from '@shared/interfaces';
import { LoggerService } from '@/common/logger/logger.service';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { UsersService } from '../users/users.service';
import { StripeBillingService } from '../stripe/services/stripe-billing.service';
import { EBillingStatus } from '@shared/enums/billing.enum';
import { EUserLevels } from '@shared/enums';
import { BillingNotificationService } from './services/billing-notification.service';
import { UserSettingsService } from '../user-settings/user-settings.service';
import { StripeCustomerService } from '../stripe/services/stripe-customer.service';
import { PaymentAdapterService } from '../payment-adapter/payment-adapter.service';
import { User } from '@/common/base-user/entities/user.entity';
import { DateTime } from 'luxon';
import { BillingEmailService } from './services/billing-email.service';
import { BillingHistoryService } from './services/billing-history.service';
import { generateInvoiceRef } from './utils/billing.utils';
import { LinkMemberService } from '../members/services/link-member.service';
import { MembersService } from '../members/members.service';

@Injectable()
export class BillingsService extends CrudService<Billing> {
  private readonly customLogger = new LoggerService(BillingsService.name);

  constructor(
    @InjectRepository(Billing)
    private readonly billingRepo: Repository<Billing>,
    private readonly usersService: UsersService,
    private readonly stripeBillingService: StripeBillingService,
    private readonly billingNotificationService: BillingNotificationService,
    private readonly userSettingsService: UserSettingsService,
    private readonly stripeCustomerService: StripeCustomerService,
    private readonly paymentAdapterService: PaymentAdapterService,
    @Inject(forwardRef(() => BillingEmailService))
    private readonly billingEmailService: BillingEmailService,
    private readonly billingHistoryService: BillingHistoryService,
    private readonly linkMemberService: LinkMemberService,
    private readonly membersService: MembersService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['recipientUser.password'],
      searchableFields: ['title', 'description', 'notes'],
    };
    super(billingRepo, moduleRef, crudOptions);
  }

  async createBilling(
    createBillingDto: CreateBillingDto,
  ): Promise<IMessageResponse & { billing: Billing }> {
    const tenantId = RequestContext.get<string>('tenantId');
    if (tenantId) {
      await this.paymentAdapterService.assertBusinessHasPaymentProcessor(tenantId);
    }

    // Check if trainer exists and is actually a trainer
    const recipientUser = await this.usersService.getUser(
      createBillingDto.recipientUser.id,
    );

    if (!recipientUser) {
      throw new NotFoundException(
        'Recipient user not found or invalid recipient level',
      );
    }

    // Calculate amount from line items if they exist, otherwise use provided amount
    let calculatedAmount = 0;
    const lineItems = createBillingDto.lineItems;
    if (lineItems && Array.isArray(lineItems) && lineItems.length > 0) {
      calculatedAmount = lineItems.reduce(
        (sum: number, item: CreateBillingLineItemDto) =>
          sum + (item.quantity || 0) * (item.unitPrice || 0),
        0,
      );
    }

    // Get billing settings for tax rate
    const billingSettings = await this.userSettingsService.getUserSettings(
      recipientUser.id,
    );

    // Apply tax rate if configured
    let finalAmount = calculatedAmount;
    if (billingSettings?.billing?.taxRate) {
      const taxAmount =
        (calculatedAmount * billingSettings.billing.taxRate) / 100;
      finalAmount = calculatedAmount + taxAmount;
    }

    // Use CRUD service create method
    const billing = await this.create<
      CreateBillingDto & { amount: number; invoiceRef: string }
    >(
      {
        ...createBillingDto,
        amount: finalAmount,
        invoiceRef: generateInvoiceRef(),
      },
      {
        beforeCreate: (processedData: CreateBillingDto) => {
          return {
            ...processedData,
            recipientUser: {
              id: processedData.recipientUser.id,
            },
          };
        },
        afterCreate: (billing: Billing) => {
          this.billingHistoryService
            .create({
              billing: { id: billing.id },
              status: EBillingStatus.PENDING,
              source: 'BILLING_CREATED',
              message: 'Billing created successfully',
            })
            .catch((error) => {
              this.customLogger.error(
                `Failed to create billing history: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error.stack : undefined,
              );
            });
        },
      },
    );

    return { message: 'Billing created successfully.', billing };
  }

  async updateBilling(
    id: string,
    updateBillingDto: UpdateBillingDto,
    currentUser: User,
  ): Promise<IMessageResponse> {
    let recipientUserId: string | undefined;

    const existingBilling = await this.getSingle(id, {
      _relations: ['recipientUser'],
    });

    if (!existingBilling) {
      throw new NotFoundException('Billing not found');
    }

    if (existingBilling.recipientUser?.id !== currentUser.id) {
      throw new ForbiddenException('You are not authorized to update this billing');
    }

    if (updateBillingDto.recipientUser && updateBillingDto.recipientUser.id) {
      // Check if trainer exists and is actually a trainer
      const recipientUser = await this.usersService.getUser(
        updateBillingDto.recipientUser.id,
      );
      if (!recipientUser) {
        throw new NotFoundException(
          'Recipient user not found or invalid recipient level',
        );
      }
      recipientUserId = recipientUser.id;
    } else {

      if (existingBilling?.recipientUser) {
        recipientUserId = existingBilling.recipientUser.id;
      }
    }

    // Calculate amount from line items if they exist, otherwise use provided amount
    let calculatedAmount: number | undefined = undefined;
    const updateLineItems = updateBillingDto.lineItems;
    if (
      updateLineItems &&
      Array.isArray(updateLineItems) &&
      updateLineItems.length > 0
    ) {
      calculatedAmount = updateLineItems.reduce(
        (sum: number, item: CreateBillingLineItemDto) =>
          sum + (item.quantity || 0) * (item.unitPrice || 0),
        0,
      );
    } else if (recipientUserId) {
      // If no amount and no line items, get existing billing amount
      const existingBilling = await this.getSingle(id, {
        _relations: ['lineItems'],
      });
      const existingLineItems = existingBilling?.lineItems;
      if (
        existingLineItems &&
        Array.isArray(existingLineItems) &&
        existingLineItems.length > 0
      ) {
        calculatedAmount = existingLineItems.reduce(
          (sum: number, item: { quantity?: number; unitPrice?: number }) =>
            sum + (item.quantity || 0) * (item.unitPrice || 0),
          0,
        );
      } else if (existingBilling?.amount) {
        calculatedAmount = existingBilling.amount;
      }
    }

    // Get billing settings for tax rate if amount is being updated
    if (calculatedAmount !== undefined && recipientUserId) {
      const billingSettings =
        await this.userSettingsService.getUserSettings(recipientUserId);

      // Apply tax rate if configured
      if (billingSettings?.billing?.taxRate) {
        const taxAmount =
          (calculatedAmount * billingSettings.billing.taxRate) / 100;
        calculatedAmount = calculatedAmount + taxAmount;
      }
    }

    // Update billing data
    await this.update(id, {
      ...updateBillingDto,
      ...(calculatedAmount !== undefined ? { amount: calculatedAmount } : {}),
    });

    return {
      message: 'Billing updated successfully',
    };
  }

  async sendBillingEmail(id: string): Promise<IMessageResponse> {
    const billing = await this.getSingle(id, {
      _relations: ['recipientUser'],
    });

    if (!billing) {
      throw new NotFoundException('Billing not found');
    }

    // Send email notification using the notification service
    await this.billingNotificationService.notifyBillingCreated(billing);
    await this.billingEmailService.sendBillingConfirmation(
      billing,
      billing.recipientUser.email,
      billing.recipientUser.firstName + ' ' + billing.recipientUser.lastName,
    );

    return {
      message: 'Billing email sent successfully to recipient',
    };
  }

  async createBillingPaymentIntent(
    billingPaymentIntentDto: BillingPaymentIntentDto,
    currentUser: User,
    timezone: string,
    metadata?: Record<string, unknown>,
    tenantId?: string,
  ): Promise<IMessageResponse & { paymentIntentId: string }> {
    const { billingId, paymentMethodId, saveForFutureUse, setAsDefault } =
      billingPaymentIntentDto;

    tenantId = tenantId || RequestContext.get<string>('tenantId');

    const billingRepository = this.getRepository(tenantId);

    const billing = await billingRepository.findOne({
      where: {
        id: billingId,
      },
      relations: ['recipientUser'],
    });

    if (!billing) {
      throw new NotFoundException('Billing not found');
    }

    // Check if current user is the recipient or a linked member
    const isRecipient = billing.recipientUser.id === currentUser.id;

    if (!isRecipient && currentUser.level === EUserLevels.MEMBER) {
      // Check if current user is a linked member of the recipient
      try {

        const currentMemberRepository = this.membersService.getRepository(tenantId);
        const recipientMemberRepository = this.membersService.getRepository(tenantId);

        const currentMember = await currentMemberRepository.findOne({
          where: {
            user: {
              id: currentUser.id,
            },
          },
        });
        const recipientMember = await recipientMemberRepository.findOne({
          where: {
            user: {
              id: billing.recipientUser.id,
            },
          },
        });

        if (currentMember && recipientMember) {
          // Check if they are linked (either direction)
          const linkAsPrimary = await this.linkMemberService.getSingle({
            primaryMemberId: recipientMember.id,
            linkedMemberId: currentMember.id,
          });

          if (!linkAsPrimary) {
            throw new ForbiddenException(
              'You are not authorized to create a payment intent for this billing',
            );
          }
        } else {
          throw new ForbiddenException(
            'You are not authorized to create a payment intent for this billing',
          );
        }
      } catch (error) {
        if (error instanceof ForbiddenException) {
          throw error;
        }
        // If member lookup fails, deny access
        throw new ForbiddenException(
          'You are not authorized to create a payment intent for this billing',
        );
      }
    }

    const { hasPaid } = await this.checkBillingPayment(billingId, tenantId);

    if (hasPaid) {
      throw new BadRequestException('Billing is already paid');
    }

    // Use payment adapter when tenant is set (business has a payment processor)
    if (tenantId) {
      const adapter = await this.paymentAdapterService.getAdapterForTenant(tenantId);
      const customer = await adapter.createOrGetCustomer(currentUser, tenantId);

      if (paymentMethodId && (saveForFutureUse || setAsDefault)) {
        await adapter.attachPaymentMethod(
          customer.customerId,
          paymentMethodId,
          setAsDefault ?? false,
          tenantId,
        ).then(() => {
          this.customLogger.log('Payment method attached successfully');
        });
      }

      const cardInfo = await adapter.getCardInfoFromPaymentMethod(paymentMethodId, tenantId);
      if (!cardInfo) {
        throw new BadRequestException('No card information found for the payment method');
      }

      const paymentIntent = await adapter.createPaymentIntent({
        amountCents: Math.round(billing.amount * 100),
        customerId: customer.customerId,
        paymentMethodId,
        confirm: true,
        metadata: {
          billingId,
          createdBy: currentUser.id,
          ...metadata,
        },
        tenantId,
      });

      if (paymentIntent.status === 'succeeded') {
        await this.update(billingId, {
          paymentIntentId: paymentIntent.id,
        });

        const attemptedAt = DateTime.now().setZone(timezone).toJSDate();

        await this.billingHistoryService.create({
          billing: { id: billingId },
          status: EBillingStatus.PAID,
          source: 'BILLING_PAYMENT_INTENT',
          message: 'Payment intent succeeded',
          metadata: {
            paymentIntentId: paymentIntent.id,
            timezone,
            cardInfo,
          },
          attemptedAt,
          paidBy: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Unknown',
        }).then(() => {
          return { message: 'Payment intent created successfully', paymentIntentId: paymentIntent.id };
        }).catch((error: Error) => {
          this.customLogger.error(`Failed to create billing history: ${error.message}`, error.stack);
        });

        const tenantIdForEvent = RequestContext.get<string>('tenantId');
        this.emitEvent('status.paid', billing, undefined, { tenantId: tenantIdForEvent });
      } else {
        const attemptedAt = DateTime.now().setZone(timezone).toJSDate();
        const failureReason = `Payment intent not successful (status=${paymentIntent.status})`;

        await this.billingHistoryService.create({
          billing: { id: billingId },
          status: EBillingStatus.FAILED,
          source: 'BILLING_PAYMENT_INTENT',
          message: failureReason,
          metadata: {
            paymentIntentId: paymentIntent.id,
            stripeStatus: paymentIntent.status,
            cardInfo,
          },
          attemptedAt,
        }).catch((error: Error) => {
          this.customLogger.error(`Failed to create billing history: ${error.message}`, error.stack);
        });

        this.emitEvent('status.failed', billing, undefined, {
          tenantId,
          reason: failureReason,
        });

        throw new BadRequestException('Failed to create payment intent');
      }

      return { message: 'Payment intent created successfully', paymentIntentId: paymentIntent.id };
    }

    // Fallback: no tenant (platform context) – use Stripe directly
    const stripeCustomer =
      await this.stripeCustomerService.createOrGetStripeCustomer(currentUser, tenantId);

    if (paymentMethodId && (saveForFutureUse || setAsDefault)) {
      await this.stripeCustomerService.attachPaymentMethod(
        stripeCustomer.stripeCustomerId,
        paymentMethodId,
        setAsDefault,
        tenantId,
      ).then(() => {
        this.customLogger.log('Payment method attached successfully');
      });
    }

    const cardInfo = await this.stripeCustomerService.getCardInfoFromPaymentMethod(paymentMethodId, tenantId);
    if (!cardInfo) {
      throw new BadRequestException('No card information found for the payment method');
    }

    const paymentIntent = await this.stripeBillingService.createPaymentIntent({
      amountCents: Math.round(billing.amount * 100),
      customerId: stripeCustomer.stripeCustomerId,
      paymentMethodId,
      confirm: true,
      metadata: {
        billingId,
        createdBy: currentUser.id,
        ...metadata,
      },
      tenantId,
    });

    if (paymentIntent.status === 'succeeded') {
      await this.update(billingId, {
        paymentIntentId: paymentIntent.id,
      });

      const attemptedAt = DateTime.now().setZone(timezone).toJSDate();

      await this.billingHistoryService.create({
        billing: { id: billingId },
        status: EBillingStatus.PAID,
        source: 'BILLING_PAYMENT_INTENT',
        message: 'Payment intent succeeded',
        metadata: {
          paymentIntentId: paymentIntent.id,
          timezone,
          cardInfo,
        },
        attemptedAt,
        paidBy: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Unknown',
      }).then(() => {
        return { message: 'Payment intent created successfully', paymentIntentId: paymentIntent.id };
      }).catch((error: Error) => {
        this.customLogger.error(`Failed to create billing history: ${error.message}`, error.stack);
      });

      // Include tenantId for multi-tenant database routing in event handlers
      const tenantIdForEvent = RequestContext.get<string>('tenantId');
      this.emitEvent('status.paid', billing, undefined, { tenantId: tenantIdForEvent });
    } else {
      const attemptedAt = DateTime.now().setZone(timezone).toJSDate();
      const failureReason = `Payment intent not successful (status=${paymentIntent.status})`;

      await this.billingHistoryService.create({
        billing: { id: billingId },
        status: EBillingStatus.FAILED,
        source: 'BILLING_PAYMENT_INTENT',
        message: failureReason,
        metadata: {
          paymentIntentId: paymentIntent.id,
          stripeStatus: paymentIntent.status,
          cardInfo,
        },
        attemptedAt,
      }).catch((error: Error) => {
        this.customLogger.error(`Failed to create billing history: ${error.message}`, error.stack);
      });

      this.emitEvent('status.failed', billing, undefined, {
        tenantId,
        reason: failureReason,
      });

      throw new BadRequestException('Failed to create payment intent');
    }


    return { message: 'Payment intent created successfully', paymentIntentId: paymentIntent.id };
  }

  async checkBillingPayment(billingId: string, tenantId?: string): Promise<{
    hasPaid: boolean;
    paidAt?: Date | null;
  }> {
    const repository = this.getRepository(tenantId);
    const billing = await repository.findOne({
      where: {
        id: billingId,
      },
    });

    if (!billing) {
      return { hasPaid: false };
    }

    // Check if the associated billing is paid based on history
    const { status, paidAt } =
      await this.getBillingStatus(billingId, tenantId);
    const hasPaidInDb = status === EBillingStatus.PAID;

    // Also verify with Stripe using the stored payment intent ID
    let hasPaidInStripe = false;
    if (billing.paymentIntentId) {
      try {
        const paymentIntent = await this.stripeBillingService.getPaymentIntent(
          billing.paymentIntentId,
        );
        hasPaidInStripe = paymentIntent.status === 'succeeded';
      } catch (error: unknown) {
        this.customLogger.warn(
          `Failed to verify payment with Stripe: ${error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const hasPaid = hasPaidInStripe || hasPaidInDb;

    return {
      hasPaid,
      paidAt,
    };
  }


  async generateInvoiceHtml(id: string, currentUser: User): Promise<string> {
    const billing = await this.getSingle(id, {
      _relations: ['recipientUser', 'lineItems'],
    });

    if (!billing) {
      throw new NotFoundException('Billing not found');
    }

    const isSuperAdmin =
      currentUser.level === (EUserLevels.SUPER_ADMIN as number);
    const isOwner =
      billing.recipientUser?.id === currentUser.id ||
      billing.createdByUserId === currentUser.id;

    if (!isSuperAdmin && !isOwner) {
      throw new ForbiddenException(
        'You are not authorized to download this invoice',
      );
    }

    const { status, paidAt } =
      await this.getBillingStatus(billing.id);

    const statusLabel = status ?? null;
    const paidAtLabel = paidAt
      ? DateTime.fromJSDate(paidAt).toFormat('yyyy-LL-dd')
      : null;

    const issueDate = DateTime.fromJSDate(billing.issueDate).toFormat(
      'yyyy-LL-dd',
    );
    const dueDate = DateTime.fromJSDate(billing.dueDate).toFormat('yyyy-LL-dd');

    const amountFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(billing.amount);

    const lineItemsHtml =
      billing.lineItems && billing.lineItems.length > 0
        ? billing.lineItems
          .map(
            (item) => `
        <tr>
          <td>${item.description || ''}</td>
          <td style="text-align:right;">${item.quantity || 0}</td>
          <td style="text-align:right;">
            ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format(item.unitPrice || 0)}
          </td>
          <td style="text-align:right;">
            ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
            }).format((item.quantity || 0) * (item.unitPrice || 0))}
          </td>
        </tr>`,
          )
          .join('\n')
        : '';

    const statusRow = statusLabel
      ? `<tr><td><strong>Status</strong></td><td>${statusLabel}</td></tr>`
      : '';

    const paidAtRow = paidAtLabel
      ? `<tr><td><strong>Paid At</strong></td><td>${paidAtLabel}</td></tr>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice - ${billing.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 24px;
      color: #333;
      background-color: #f9fafb;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      padding: 24px;
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0 24px 0;
    }
    .meta-table td {
      padding: 4px 0;
      vertical-align: top;
    }
    .meta-table td:first-child {
      width: 140px;
      font-weight: bold;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    .items-table th,
    .items-table td {
      border: 1px solid #e5e7eb;
      padding: 8px;
      font-size: 14px;
    }
    .items-table th {
      background-color: #f3f4f6;
      text-align: left;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <h1>Invoice</h1>
    <p><strong>${billing.title}</strong></p>

    <table class="meta-table">
      <tr>
        <td>Invoice ID</td>
        <td>${billing.id}</td>
      </tr>
      <tr>
        <td>Recipient</td>
        <td>${billing.recipientUser?.firstName || ''} ${billing.recipientUser?.lastName || ''
      }</td>
      </tr>
      <tr>
        <td>Issue Date</td>
        <td>${issueDate}</td>
      </tr>
      <tr>
        <td>Due Date</td>
        <td>${dueDate}</td>
      </tr>
      <tr>
        <td>Amount</td>
        <td>${amountFormatted}</td>
      </tr>
      ${statusRow}
      ${paidAtRow}
    </table>

    ${billing.description
        ? `<p><strong>Description:</strong> ${billing.description}</p>`
        : ''
      }

    ${lineItemsHtml
        ? `<table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:right;">Quantity</th>
          <th style="text-align:right;">Unit Price</th>
          <th style="text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
    </table>`
        : ''
      }
  </div>
</body>
</html>`;
  }

  async generateInvoicePdf(id: string, currentUser: User): Promise<Buffer> {
    const html = await this.generateInvoiceHtml(id, currentUser);
    // NOTE: This is a placeholder implementation that returns the HTML bytes
    // as a PDF download. To generate a true PDF, wire up a PDF library
    // (e.g. pdfkit or a HTML-to-PDF service) here.
    return Buffer.from(html, 'utf-8');
  }

  async updateBillingNotes(
    id: string,
    updateNotesDto: UpdateBillingNotesDto,
  ): Promise<IMessageResponse> {
    const existingBilling = await this.getSingle(id);

    if (!existingBilling) {
      throw new NotFoundException('Billing not found');
    }

    if (updateNotesDto.notes !== undefined) {
      await this.update(id, {
        notes: updateNotesDto.notes,
      });
    }

    return { message: 'Billing notes updated successfully' };
  }

  async updateBillingStatus(
    id: string,
    updateStatusDto: UpdateBillingStatusDto,
    currentUser: User,
    timezone: string,
  ): Promise<IMessageResponse> {
    const billing = await this.getSingle(id, {
      _relations: ['recipientUser', 'createdBy'],
    });

    if (!billing) {
      throw new NotFoundException('Billing not found');
    }

    // Check if billing is cashable
    if (!billing.isCashable) {
      throw new ForbiddenException(
        'This billing cannot be manually updated. Only cashable billings can have their status changed manually.',
      );
    }

    const isSuperAdmin =
      currentUser.level === (EUserLevels.SUPER_ADMIN as number);
    const isCreator = billing.createdBy?.id === currentUser.id;
    const isRecipient = billing.recipientUser?.id === currentUser.id;

    if (!isSuperAdmin && !isCreator && !isRecipient) {
      throw new ForbiddenException(
        'You are not authorized to update this billing status',
      );
    }

    const { status, message } = updateStatusDto as {
      status: EBillingStatus;
      message?: string;
    };

    // Create billing history entry
    await this.billingHistoryService.create({
      billing: { id: billing.id },
      status,
      source: 'BILLING_STATUS_MANUAL_UPDATE',
      message: message || `Status manually updated to ${status}`,
      attemptedAt: DateTime.now().setZone(timezone).toJSDate(),
    });

    // Emit event for status change (will trigger SMS notifications)
    const tenantId = RequestContext.get<string>('tenantId');
    if (status === EBillingStatus.PAID) {
      this.emitEvent('status.paid', billing, undefined, { tenantId });
    } else if (status === EBillingStatus.FAILED) {
      this.emitEvent('status.failed', billing, undefined, {
        tenantId,
        reason: message || 'Payment failed',
      });
    } else if (status === EBillingStatus.PENDING) {
      this.emitEvent('status.pending', billing, undefined, { tenantId });
    }

    return { message: 'Billing status updated successfully' };
  }

  async getBillingStatus(
    billingId: string,
    tenantId?: string,
  ): Promise<{ status: EBillingStatus | null; paidAt?: Date | null }> {
    const lastHistory = await this.billingHistoryService.getLatestBillingHistoryQuery(tenantId)
      .andWhere('bh.billingId = :billingId', { billingId: billingId })
      .getOne();

    if (!lastHistory) {
      return { status: null, paidAt: null };
    }

    let paidAt: Date | null = null;
    if (lastHistory.status === EBillingStatus.PAID) {
      paidAt = lastHistory.attemptedAt ?? lastHistory.createdAt;
    }

    return {
      status: lastHistory.status,
      paidAt,
    };
  }

  async getOutstandingBillingSummary(
    userId: string,
    query: { limit?: number },
  ): Promise<{
    recentBillings: (Billing & { status: EBillingStatus | null })[];
    totalOutstanding: number;
    totalOutstandingCount: number;
  }> {

    const recentBillings = await this.getRecentPendingOrOverdueBillings(userId, query.limit);
    const totals = await this.getPendingBillingTotals(userId);

    return {
      recentBillings,
      totalOutstanding: totals.totalAmount,
      totalOutstandingCount: totals.totalCount,
    };
  }

  async getRecentPendingOrOverdueBillings(
    userId: string,
    limit?: number,
  ): Promise<(Billing & { status: EBillingStatus | null })[]> {
    const statuses = [EBillingStatus.PENDING, EBillingStatus.OVERDUE];

    const latestHistories = await this.billingHistoryService
      .getLatestBillingHistoryQuery()
      .andWhere('bh.status IN (:...statuses)', { statuses })
      .andWhere('billing.recipientUserId = :userId', { userId })
      .orderBy('bh.createdAt', 'DESC')
      .take(limit || 5)
      .getMany();

    // Map to billing + status, preserving entity type
    return latestHistories.map((history) => {
      const billing = history.billing as Billing;
      return Object.assign(billing, { status: history.status });
    });
  }


  async getPendingBillingTotals(userId: string) {
    const statuses = [EBillingStatus.PENDING, EBillingStatus.OVERDUE];
    const totals = await this.billingHistoryService
      .getLatestBillingHistoryQuery()
      .andWhere('bh.status IN (:...statuses)', { statuses })
      .andWhere('billing.recipientUserId = :userId', { userId })
      .select('COUNT(billing.id)', 'totalCount')
      .addSelect('SUM(billing.amount)', 'totalAmount')
      .getRawOne();

    return {
      totalCount: Number(totals?.totalCount || 0),
      totalAmount: Number(totals?.totalAmount || 0),
    };
  }

}
