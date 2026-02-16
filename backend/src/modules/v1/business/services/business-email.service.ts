import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Business } from '../entities/business.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { EmailTemplateService } from '@/common/email/email-template.service';

export enum BusinessEmailType {
  CREATED = 'created',
  ACTIVATED = 'activated',
  DELETED = 'deleted',
}

export interface BusinessEmailContext {
  business: Business;
  recipientEmail?: string;
  recipientName?: string;
  emailType?: BusinessEmailType;
}

interface BusinessEmailTemplateData {
  business: Business;
  recipientEmail: string;
  recipientName: string;
  loginUrl: string;
  businessUrl: string;
  emailType: BusinessEmailType;
}

@Injectable()
export class BusinessEmailService {
  private readonly logger = new LoggerService(BusinessEmailService.name);
  private readonly appConfig: any;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    this.appConfig = this.configService.get('app');
  }

  /**
   * Send business created email when business is added
   */
  async sendBusinessCreated(
    business: Business,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: BusinessEmailContext = {
        business,
        emailType: BusinessEmailType.CREATED,
        recipientEmail,
        recipientName,
      };

      await this.sendBusinessEmail(context);
      this.logger.log(
        `Business created email sent for business: ${business.name}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send business created email for business ${business.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send business activated email when business is activated
   */
  async sendBusinessActivated(
    business: Business,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: BusinessEmailContext = {
        business,
        emailType: BusinessEmailType.ACTIVATED,
        recipientEmail,
        recipientName,
      };

      await this.sendBusinessEmail(context);
      this.logger.log(
        `Business activated email sent for business: ${business.name}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send business activated email for business ${business.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send business deleted email when business is deleted
   */
  async sendBusinessDeleted(
    business: Business,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: BusinessEmailContext = {
        business,
        emailType: BusinessEmailType.DELETED,
        recipientEmail,
        recipientName,
      };

      await this.sendBusinessEmail(context);
      this.logger.log(
        `Business deleted email sent for business: ${business.name}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send business deleted email for business ${business.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generic method to send business-related emails
   */
  private async sendBusinessEmail(context: BusinessEmailContext): Promise<void> {
    try {
      const { business, recipientEmail, recipientName, emailType } = context;

      if (!recipientEmail) {
        this.logger.warn(`No recipient email found for business ${business.id}`);
        return;
      }

      const templateData: BusinessEmailTemplateData = {
        business,
        recipientEmail,
        recipientName: recipientName || 'User',
        loginUrl: `${this.appConfig.frontendUrl}/login`,
        businessUrl: `${this.appConfig.frontendUrl}/business`,
        emailType: emailType || BusinessEmailType.CREATED,
      };

      const emailConfig = this.getEmailConfig(
        emailType || BusinessEmailType.CREATED,
      );

      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: emailConfig.subject,
        html: this.generateBusinessEmailHTML(
          templateData,
          emailType || BusinessEmailType.CREATED,
        ),
        text: this.generateBusinessEmailText(
          templateData,
          emailType || BusinessEmailType.CREATED,
        ),
      });
    } catch (error) {
      this.logger.error(`Failed to send business email:`, error);
      throw error;
    }
  }

  /**
   * Get email configuration based on email type
   */
  private getEmailConfig(emailType: BusinessEmailType) {
    switch (emailType) {
      case BusinessEmailType.CREATED:
        return {
          subject: 'Business Created - Welcome to Our Platform!',
          template: 'business-created',
        };

      case BusinessEmailType.ACTIVATED:
        return {
          subject: 'Business Activated - Your Business is Now Live!',
          template: 'business-activated',
        };

      case BusinessEmailType.DELETED:
        return {
          subject: 'Business Deleted - Your Business Has Been Removed',
          template: 'business-deleted',
        };

      default:
        return {
          subject: 'Business Update',
          template: 'business-default',
        };
    }
  }

  /**
   * Generate HTML email template for business emails
   */
  private generateBusinessEmailHTML(
    data: BusinessEmailTemplateData,
    emailType: BusinessEmailType,
  ): string {
    const { business, recipientName, businessUrl } = data;
    const appName = this.appConfig.name;
    const createdDate = new Date(business.createdAt).toLocaleDateString();

    const getEmailContent = () => {
      switch (emailType) {
        case BusinessEmailType.CREATED:
          return {
            title: 'Business Created',
            message: `Your business "${business.name}" has been successfully created and is ready for setup.`,
            actionText: 'View Business',
            actionUrl: businessUrl,
            additionalInfo:
              'Please complete your business setup and subscription to activate your business.',
          };
        case BusinessEmailType.ACTIVATED:
          return {
            title: 'Business Activated',
            message: `Congratulations! Your business "${business.name}" has been successfully activated and is now live.`,
            actionText: 'Access Your Business',
            actionUrl: businessUrl,
            additionalInfo:
              'Your business is now active and ready to use. You can start managing your operations.',
          };
        case BusinessEmailType.DELETED:
          return {
            title: 'Business Deleted',
            message: `Your business "${business.name}" has been deleted from our platform.`,
            actionText: 'View Other Businesses',
            actionUrl: businessUrl,
            additionalInfo:
              'If you have any questions or need assistance, please contact our support team.',
          };
        default:
          return {
            title: 'Business Update',
            message: `Your business "${business.name}" has been updated.`,
            actionText: 'View Business',
            actionUrl: businessUrl,
            additionalInfo: 'Please check the updated details for any changes.',
          };
      }
    };

    const content = getEmailContent();

    const businessDetails = `
      <div class="info-box">
        <p style="margin: 0 0 8px 0;"><strong>Business Name:</strong> ${business.name}</p>
        ${business.subdomain ? `<p style="margin: 0 0 8px 0;"><strong>Subdomain:</strong> ${business.subdomain}</p>` : ''}
        <p style="margin: 0 0 8px 0;"><strong>Created Date:</strong> ${createdDate}</p>
        ${business.tenantId ? `<p style="margin: 0;"><strong>Tenant ID:</strong> ${business.tenantId}</p>` : ''}
      </div>
    `;

    return this.emailTemplateService.generateHTML({
      title: content.title,
      greeting: `Dear ${recipientName}`,
      content: `
        <p>${content.message}</p>
        ${businessDetails}
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
   * Generate text email template for business emails
   */
  private generateBusinessEmailText(
    data: BusinessEmailTemplateData,
    emailType: BusinessEmailType,
  ): string {
    const { business, recipientName, businessUrl } = data;
    const appName = this.appConfig.name;
    const createdDate = new Date(business.createdAt).toLocaleDateString();

    const getEmailContent = () => {
      switch (emailType) {
        case BusinessEmailType.CREATED:
          return {
            title: 'Business Created',
            message: `Your business "${business.name}" has been successfully created and is ready for setup.`,
            additionalInfo:
              'Please complete your business setup and subscription to activate your business.',
          };
        case BusinessEmailType.ACTIVATED:
          return {
            title: 'Business Activated',
            message: `Congratulations! Your business "${business.name}" has been successfully activated and is now live.`,
            additionalInfo:
              'Your business is now active and ready to use. You can start managing your operations.',
          };
        case BusinessEmailType.DELETED:
          return {
            title: 'Business Deleted',
            message: `Your business "${business.name}" has been deleted from our platform.`,
            additionalInfo:
              'If you have any questions or need assistance, please contact our support team.',
          };
        default:
          return {
            title: 'Business Update',
            message: `Your business "${business.name}" has been updated.`,
            additionalInfo: 'Please check the updated details for any changes.',
          };
      }
    };

    const content = getEmailContent();

    const businessDetailsText = `
Business Name: ${business.name}
${business.subdomain ? `Subdomain: ${business.subdomain}` : ''}
Created Date: ${createdDate}
${business.tenantId ? `Tenant ID: ${business.tenantId}` : ''}
    `;

    return this.emailTemplateService.generateText({
      title: content.title,
      greeting: `Dear ${recipientName}`,
      content: `
${content.message}

Business Details:
${businessDetailsText}
${content.additionalInfo ? `\n${content.additionalInfo}` : ''}
      `,
      actionButton: {
        text: 'View Business',
        url: businessUrl,
      },
      appName,
    });
  }
}
