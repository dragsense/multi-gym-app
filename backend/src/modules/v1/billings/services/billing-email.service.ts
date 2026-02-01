import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Billing } from '../entities/billing.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { BillingHistoryService } from './billing-history.service';
import { BillingsService } from '../billings.service';
import { EmailTemplateService } from '@/common/email/email-template.service';

export enum BillingReminderType {
  CONFIRMATION = 'confirmation',
  REMINDER = 'reminder',
  OVERDUE = 'overdue',
  PAID = 'paid',
  DELETED = 'deleted',
  UPDATED = 'updated',
}

export interface BillingEmailContext {
  billing: Billing;
  recipientEmail?: string;
  recipientName?: string;
  reminderType?: BillingReminderType;
  dueDate?: Date;
  amount?: number;
}

interface BillingEmailTemplateData {
  billing: Billing;
  recipientEmail: string;
  recipientName: string;
  loginUrl: string;
  billingUrl: string;
  reminderType: BillingReminderType;
}

@Injectable()
export class BillingEmailService {
  private readonly logger = new LoggerService(BillingEmailService.name);
  private readonly appConfig: any;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => BillingsService))
    private readonly billingServices: BillingsService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    this.appConfig = this.configService.get('app');
  }

  /**
   * Send billing confirmation email when billing is created
   */
  async sendBillingConfirmation(
    billing: Billing,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: BillingEmailContext = {
        billing,
        reminderType: BillingReminderType.CONFIRMATION,
        recipientEmail,
        recipientName,
      };

      await this.sendBillingEmail(context);
      this.logger.log(
        `Billing confirmation email sent for billing: ${billing.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send billing confirmation email for billing ${billing.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send billing reminder email
   */
  async sendBillingReminder(
    billing: Billing,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: BillingEmailContext = {
        billing,
        reminderType: BillingReminderType.REMINDER,
        recipientEmail,
        recipientName,
      };

      await this.sendBillingEmail(context);
      this.logger.log(
        `Billing reminder email sent for billing: ${billing.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send billing reminder email for billing ${billing.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send billing overdue email
   */
  async sendBillingOverdue(
    billing: Billing,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: BillingEmailContext = {
        billing,
        reminderType: BillingReminderType.OVERDUE,
        recipientEmail,
        recipientName,
      };

      await this.sendBillingEmail(context);
      this.logger.log(
        `Billing overdue email sent for billing: ${billing.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send billing overdue email for billing ${billing.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send billing paid confirmation email
   */
  async sendBillingPaid(
    billing: Billing,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: BillingEmailContext = {
        billing,
        reminderType: BillingReminderType.PAID,
        recipientEmail,
        recipientName,
      };

      await this.sendBillingEmail(context);
      this.logger.log(
        `Billing paid confirmation email sent for billing: ${billing.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send billing paid confirmation email for billing ${billing.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send billing deleted email
   */
  async sendBillingDeleted(
    billing: Billing,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: BillingEmailContext = {
        billing,
        reminderType: BillingReminderType.DELETED,
        recipientEmail,
        recipientName,
      };

      await this.sendBillingEmail(context);
      this.logger.log(
        `Billing deleted email sent for billing: ${billing.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send billing deleted email for billing ${billing.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send billing updated email
   */
  async sendBillingUpdated(
    billing: Billing,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: BillingEmailContext = {
        billing,
        reminderType: BillingReminderType.UPDATED,
        recipientEmail,
        recipientName,
      };

      await this.sendBillingEmail(context);
      this.logger.log(
        `Billing updated email sent for billing: ${billing.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send billing updated email for billing ${billing.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generic method to send billing-related emails
   */
  private async sendBillingEmail(context: BillingEmailContext): Promise<void> {
    try {
      const { billing, recipientEmail, recipientName, reminderType } = context;

      if (!recipientEmail) {
        this.logger.warn(`No recipient email found for billing ${billing.id}`);
        return;
      }

      const templateData: BillingEmailTemplateData = {
        billing,
        recipientEmail,
        recipientName: recipientName || 'User',
        loginUrl: `${this.appConfig.frontendUrl}/login`,
        billingUrl: `${this.appConfig.frontendUrl}/billings`,
        reminderType: reminderType || BillingReminderType.CONFIRMATION,
      };

      const emailConfig = this.getEmailConfig(
        reminderType || BillingReminderType.CONFIRMATION,
      );

      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: emailConfig.subject,
        html: await this.generateBillingEmailHTML(
          templateData,
          reminderType || BillingReminderType.CONFIRMATION,
        ),
        text: this.generateBillingEmailText(
          templateData,
          reminderType || BillingReminderType.CONFIRMATION,
        ),
      });
    } catch (error) {
      this.logger.error(`Failed to send billing email:`, error);
      throw error;
    }
  }

  /**
   * Get email configuration based on reminder type
   */
  private getEmailConfig(reminderType: BillingReminderType) {
    switch (reminderType) {
      case BillingReminderType.CONFIRMATION:
        return {
          subject: 'Billing Confirmation - Your Invoice is Ready',
          template: 'billing-confirmation',
        };

      case BillingReminderType.REMINDER:
        return {
          subject: 'Billing Reminder - Payment Due Soon',
          template: 'billing-reminder',
        };

      case BillingReminderType.OVERDUE:
        return {
          subject: 'Overdue Billing - Payment Required',
          template: 'billing-overdue',
        };

      case BillingReminderType.PAID:
        return {
          subject: 'Payment Confirmed - Thank You!',
          template: 'billing-paid',
        };

      case BillingReminderType.DELETED:
        return {
          subject: 'Billing Deleted - Invoice Deleted',
          template: 'billing-deleted',
        };
      case BillingReminderType.UPDATED:
        return {
          subject: 'Billing Updated - Invoice Updated',
          template: 'billing-updated',
        };

      default:
        return {
          subject: 'Billing Update',
          template: 'billing-default',
        };
    }
  }

  /**
   * Generate HTML email template for billing emails
   */
  private async generateBillingEmailHTML(
    data: BillingEmailTemplateData,
    reminderType: BillingReminderType,
  ): Promise<string> {
    const { billing, recipientName, billingUrl } = data;
    const appName = this.appConfig.name;
    const appUrl = this.appConfig.appUrl || '';
    const apiPrefix = this.appConfig.apiPrefix || 'api/v1';
    const invoiceHtmlUrl = `${appUrl.replace(/\/$/, '')}/${apiPrefix}/billings/${billing.id}/invoice-html`;
    const invoicePdfUrl = `${appUrl.replace(/\/$/, '')}/${apiPrefix}/billings/${billing.id}/invoice-pdf`;
    const issueDate = new Date(billing.issueDate).toLocaleDateString();
    const dueDate = new Date(billing.dueDate).toLocaleDateString();
        //Add sataus variable here with  and call getbilling status funcionn
    const billingStatus=await this.billingServices.getBillingStatus(billing.id)
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(billing.amount);

    const getEmailContent = () => {
      switch (reminderType) {
        case BillingReminderType.CONFIRMATION:
          return {
            title: 'Invoice Confirmed',
            message: `Your invoice "${billing.title}" has been created and is ready for payment.`,
            actionText: 'View Invoice',
            actionUrl: billingUrl,
            additionalInfo:
              'Please review the invoice details and make payment by the due date.',
          };
        case BillingReminderType.REMINDER:
          return {
            title: 'Payment Reminder',
            message: `This is a reminder that your invoice "${billing.title}" payment is due soon.`,
            actionText: 'View Invoice',
            actionUrl: billingUrl,
            additionalInfo:
              'Please make payment by the due date to avoid any late fees.',
          };
        case BillingReminderType.OVERDUE:
          return {
            title: 'Overdue Invoice',
            message: `Your invoice "${billing.title}" payment is now overdue.`,
            actionText: 'Pay Now',
            actionUrl: billingUrl,
            additionalInfo:
              'Please make payment as soon as possible to avoid any additional charges.',
          };
        case BillingReminderType.PAID:
          return {
            title: 'Payment Confirmed',
            message: `Your payment for invoice "${billing.title}" has been successfully processed.`,
            actionText: 'View Invoice',
            actionUrl: billingUrl,
            additionalInfo: 'Thank you for your payment!',
          };
        case BillingReminderType.DELETED:
          return {
            title: 'Invoice Deleted',
            message: `Your invoice "${billing.title}" has been deleted.`,
            actionText: 'View Other Invoices',
            actionUrl: billingUrl,
            additionalInfo:
              'If you have any questions, please contact our support team.',
          };
        default:
          return {
            title: 'Billing Update',
            message: `Your invoice "${billing.title}" has been updated.`,
            actionText: 'View Invoice',
            actionUrl: billingUrl,
            additionalInfo: 'Please check the updated details for any changes.',
          };
      }
    };

    const content = getEmailContent();

    const lineItemsHtml = billing.lineItems && billing.lineItems.length > 0
      ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e0e0e0;">
          <p style="margin: 0 0 8px 0;"><strong>Line Items:</strong></p>
          ${billing.lineItems.map((item) => {
            const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
            return `<p style="margin: 4px 0; font-size: 13px;">${item.description || 'N/A'} - Qty: ${item.quantity || 0} × ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice || 0)} = ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemTotal)}</p>`;
          }).join('')}
        </div>
      `
      : '';

    const invoiceLinks = `
      <div class="info-box" style="margin-top: 16px;">
        <p style="margin: 0 0 8px 0;"><strong>Invoice Copies:</strong></p>
        <p style="margin: 4px 0;"><a href="${invoiceHtmlUrl}" class="link">View HTML Invoice</a></p>
        <p style="margin: 4px 0;"><a href="${invoicePdfUrl}" class="link">Download PDF Invoice</a></p>
      </div>
    `;

    const billingDetails = `
      <div class="info-box">
        <p style="margin: 0 0 8px 0;"><strong>Title:</strong> ${billing.title}</p>
        <p style="margin: 0 0 8px 0;"><strong>Type:</strong> ${billing.type}</p>
        <p style="margin: 0 0 8px 0;"><strong>Issue Date:</strong> ${issueDate}</p>
        <p style="margin: 0 0 8px 0;"><strong>Due Date:</strong> ${dueDate}</p>
        <p style="margin: 0 0 8px 0;"><strong>Status:</strong> ${billingStatus.status}</p>
        <p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ${formattedAmount}</p>
        ${billing.description ? `<p style="margin: 0 0 8px 0;"><strong>Description:</strong> ${billing.description}</p>` : ''}
        ${lineItemsHtml}
      </div>
      ${invoiceLinks}
    `;

    return this.emailTemplateService.generateHTML({
      title: content.title,
      greeting: `Dear ${recipientName}`,
      content: `
        <p>${content.message}</p>
        ${billingDetails}
        ${content.additionalInfo ? `<p style="margin-top: 16px;">${content.additionalInfo}</p>` : ''}
      `,
      actionButton: {
        text: content.actionText,
        url: content.actionUrl,
      },
      appName,
    });
  }

  /**
   * Generate text email template for billing emails
   */
  private generateBillingEmailText(
    data: BillingEmailTemplateData,
    reminderType: BillingReminderType,
  ): string {
    const { billing, recipientName, billingUrl } = data;
    const appName = this.appConfig.name;
    const issueDate = new Date(billing.issueDate).toLocaleDateString();
    const dueDate = new Date(billing.dueDate).toLocaleDateString();
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(billing.amount);

    const getEmailContent = () => {
      switch (reminderType) {
        case BillingReminderType.CONFIRMATION:
          return {
            title: 'Invoice Confirmed!',
            message: `Your invoice "${billing.title}" has been created and is ready for payment.`,
            additionalInfo:
              'Please review the invoice details and make payment by the due date.',
          };
        case BillingReminderType.REMINDER:
          return {
            title: 'Payment Reminder',
            message: `This is a reminder that your invoice "${billing.title}" payment is due soon.`,
            additionalInfo:
              'Please make payment by the due date to avoid any late fees.',
          };
        case BillingReminderType.OVERDUE:
          return {
            title: 'Overdue Invoice',
            message: `Your invoice "${billing.title}" payment is now overdue.`,
            additionalInfo:
              'Please make payment as soon as possible to avoid any additional charges.',
          };
        case BillingReminderType.PAID:
          return {
            title: 'Payment Confirmed!',
            message: `Your payment for invoice "${billing.title}" has been successfully processed.`,
            additionalInfo: 'Thank you for your payment!',
          };
        case BillingReminderType.DELETED:
          return {
            title: 'Invoice Deleted',
            message: `Your invoice "${billing.title}" has been deleted.`,
            additionalInfo:
              'If you have any questions, please contact our support team.',
          };
        default:
          return {
            title: 'Billing Update',
            message: `Your invoice "${billing.title}" has been updated.`,
            additionalInfo: 'Please check the updated details for any changes.',
          };
      }
    };

    const content = getEmailContent();

    const lineItemsText = billing.lineItems && billing.lineItems.length > 0
      ? `\nLine Items:\n${billing.lineItems.map((item) => {
          const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
          return `  - ${item.description || 'N/A'} - Qty: ${item.quantity || 0} × ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice || 0)} = ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemTotal)}`;
        }).join('\n')}`
      : '';

    const billingDetailsText = `
Title: ${billing.title}
Type: ${billing.type}
Issue Date: ${issueDate}
Due Date: ${dueDate}
Amount: ${formattedAmount}
${billing.description ? `Description: ${billing.description}` : ''}
${lineItemsText}
    `;

    return this.emailTemplateService.generateText({
      title: content.title,
      greeting: `Dear ${recipientName}`,
      content: `
${content.message}

Invoice Details:
${billingDetailsText}
${content.additionalInfo ? `\n${content.additionalInfo}` : ''}
      `,
      actionButton: {
        text: 'View Invoice',
        url: billingUrl,
      },
      appName,
    });
  }
}
