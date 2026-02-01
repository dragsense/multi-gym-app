import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BillingEmailService } from '@/modules/v1/billings/services/billing-email.service';
import { BillingsService } from '../billings.service';
import { UsersService } from '@/modules/v1/users/users.service';
import { RequestContext } from '@/common/context/request-context';

@Processor('billing')
@Injectable()
export class BillingProcessor {
  private readonly logger = new Logger(BillingProcessor.name);

  constructor(
    private readonly billingEmailService: BillingEmailService,
    private readonly billingsService: BillingsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Handle send billing confirmation
   */
  @Process('send-billing-confirmation')
  async handleSendBillingConfirmation(job: Job): Promise<void> {
    const { billingId, recipientId, tenantId } = job.data;

    this.logger.log(`Processing billing confirmation for billing ${billingId}`);

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const billing = await this.billingsService.getSingle(billingId, {
          _relations: ['recipientUser'],
        });
        if (!billing) throw new NotFoundException('Billing not found');
        const user = await this.usersService.getUser(recipientId as string);
        await this.billingEmailService.sendBillingConfirmation(
          billing,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Billing confirmation sent successfully for billing ${billingId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send billing confirmation for billing ${billingId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send billing reminder
   */
  @Process('send-billing-reminder')
  async handleSendBillingReminder(job: Job): Promise<void> {
    const { billingId, recipientId, tenantId } = job.data;

    this.logger.log(`Processing billing reminder for billing ${billingId}`);

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const billing = await this.billingsService.getSingle(billingId, {
          _relations: ['recipientUser'],
        });
        if (!billing) throw new NotFoundException('Billing not found');
        const user = await this.usersService.getUser(recipientId as string);
        await this.billingEmailService.sendBillingReminder(
          billing,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Billing reminder sent successfully for billing ${billingId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send billing reminder for billing ${billingId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send billing overdue
   */
  @Process('send-billing-overdue')
  async handleSendBillingOverdue(job: Job): Promise<void> {
    const { billingId, recipientId, tenantId } = job.data;

    this.logger.log(`Processing billing overdue for billing ${billingId}`);

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const billing = await this.billingsService.getSingle(billingId, {
          _relations: ['recipientUser'],
        });
        if (!billing) throw new NotFoundException('Billing not found');
        const user = await this.usersService.getUser(recipientId as string);
        await this.billingEmailService.sendBillingOverdue(
          billing,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Billing overdue sent successfully for billing ${billingId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send billing overdue for billing ${billingId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send billing paid
   */
  @Process('send-billing-paid')
  async handleSendBillingPaid(job: Job): Promise<void> {
    const { billingId, recipientId, tenantId } = job.data;

    this.logger.log(
      `Processing billing paid confirmation for billing ${billingId}`,
    );

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const billing = await this.billingsService.getSingle(billingId, {
          _relations: ['recipientUser'],
        });
        if (!billing) throw new NotFoundException('Billing not found');
        const user = await this.usersService.getUser(recipientId as string);

        await this.billingEmailService.sendBillingPaid(
          billing,
          user.email,
          `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        );

        this.logger.log(
          `Billing paid confirmation sent successfully for billing ${billingId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send billing paid confirmation for billing ${billingId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send billing deleted
   */
  @Process('send-billing-deleted')
  async handleSendBillingDeleted(job: Job): Promise<void> {
    const { billingId, recipientId, tenantId } = job.data;

    this.logger.log(
      `Processing billing deleted notification for billing ${billingId}`,
    );

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const billing = await this.billingsService.getSingle(
          billingId,
          {
            _relations: ['recipientUser'],
          },
          true,
        );
        if (!billing) throw new NotFoundException('Billing not found');

        const user = await this.usersService.getUser(recipientId as string);
        await this.billingEmailService.sendBillingDeleted(
          billing,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Billing deleted notification sent successfully for billing ${billingId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send billing deleted notification for billing ${billingId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send billing updated
   */
  @Process('send-billing-updated')
  async handleSendBillingUpdated(job: Job): Promise<void> {
    const { billingId, recipientId, tenantId } = job.data;

    this.logger.log(
      `Processing billing updated notification for billing ${billingId}`,
    );

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const billing = await this.billingsService.getSingle(billingId, {
          _relations: ['recipientUser'],
        });
        if (!billing) throw new NotFoundException('Billing not found');
        const user = await this.usersService.getUser(recipientId as string);

        await this.billingEmailService.sendBillingUpdated(
          billing,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Billing updated notification sent successfully for billing ${billingId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send billing updated notification for billing ${billingId}:`,
          error,
        );
        throw error;
      }
    });
  }
}
