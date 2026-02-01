import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '@/common/base-user/entities/user.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { EmailTemplateService } from '@/common/email/email-template.service';
import { getUserRole } from '@/lib/utils';

export interface OnboardingEmailContext {
  user: User;
  tempPassword?: string;
  welcomeMessage?: string;
  additionalInstructions?: string;
}

interface EmailTemplateData {
  user: User;
  appName: string;
  loginUrl: string;
  tempPassword?: string;
}

@Injectable()
export class UserEmailService {
  private readonly logger = new LoggerService(UserEmailService.name);
  private readonly appConfig: any;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    this.appConfig = this.configService.get('app');
  }

  /**
   * Sends appropriate onboarding email based on context
   */
  async sendOnboardingEmail(context: OnboardingEmailContext): Promise<void> {
    try {
      const { user } = context;
      await this.sendWelcomeEmail(context);
      this.logger.log(`Onboarding email sent successfully to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send onboarding email to ${context.user.email}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Admin self-registration welcome email
   */
  async sendWelcomeEmail(context: OnboardingEmailContext): Promise<void> {
    const { user, tempPassword } = context;
    const loginUrl = `${this.appConfig.appUrl}/${this.appConfig.loginPath}`;

    const templateData: EmailTemplateData = {
      user,
      appName: this.appConfig.name,
      loginUrl,
      tempPassword,
    };

    await this.mailerService.sendMail({
      to: user.email,
      from: this.configService.get('MAIL_FROM'),
      subject: `Welcome to ${this.appConfig.name} - Account Created`,
      html: this.generateWelcomeEmailHTML(templateData),
      text: this.generateWelcomeEmailText(templateData),
    });
  }

  private generateWelcomeEmailHTML(data: EmailTemplateData): string {
    const { user, appName, loginUrl, tempPassword } = data;
    const userName = user.firstName || 'Valued Customer';
    const roleName = getUserRole(user.level, true);

    const accountInfo = `
      <div class="info-box">
        <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${user.email}</p>
        <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${user.firstName || 'Customer'} ${user.lastName || ''}</p>
        <p style="margin: 0;"><strong>Role:</strong> ${roleName}</p>
      </div>
    `;

    const credentialsSection = tempPassword
      ? `
      <div class="info-box" style="border-left: 3px solid #d0d0d0;">
        <p style="margin: 0 0 12px 0;"><strong>Temporary Password:</strong></p>
        <code style="font-size: 16px; padding: 8px 16px; display: inline-block; margin-bottom: 12px;">${tempPassword}</code>
        <p style="margin: 0; font-size: 13px; color: #666666;">For security reasons, please change your password after your first login.</p>
      </div>
    `
      : '';

    return this.emailTemplateService.generateHTML({
      title: 'Welcome to ' + appName,
      greeting: `Dear ${userName}`,
      content: `
        <p>Welcome to ${appName}! We're excited to have you on board. Your account has been created and is ready for use.</p>
        ${accountInfo}
        ${credentialsSection}
      `,
      actionButton: {
        text: 'Access Your Account',
        url: loginUrl,
      },
      appName,
    });
  }

  private generateWelcomeEmailText(data: EmailTemplateData): string {
    const { user, appName, loginUrl, tempPassword } = data;
    const userName = user.firstName || 'Valued Customer';
    const roleName = getUserRole(user.level, true);

    const credentialsText = tempPassword
      ? `
Login Credentials:
- Temporary Password: ${tempPassword}
- Login URL: ${loginUrl}

For security reasons, please change your password after your first login.
`
      : `
Access your account at: ${loginUrl}
`;

    return this.emailTemplateService.generateText({
      title: 'Welcome to ' + appName,
      greeting: `Dear ${userName}`,
      content: `
Welcome to ${appName}! We're excited to have you on board. Your account has been created and is ready for use.

Account Details:
- Email: ${user.email}
- Name: ${user.firstName || 'Customer'} ${user.lastName || ''}
- Role: ${roleName}

${credentialsText}
      `,
      appName,
    });
  }

  /**
   * Send password reset success notification
   */
  async sendPasswordResetConfirmation(
    user: User,
    superAdmin: User,
  ): Promise<void> {
    try {
      const supportEmail = superAdmin.email;

      await this.mailerService.sendMail({
        to: user.email,
        from: this.configService.get('MAIL_FROM'),
        subject: `Password Reset Successful - ${this.appConfig.name}`,
        html: this.generatePasswordResetConfirmationHTML(supportEmail),
        text: this.generatePasswordResetConfirmationText(supportEmail),
      });

      this.logger.log(`Password reset confirmation sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset confirmation to ${user.email}:`,
        error,
      );
    }
  }

  private generatePasswordResetConfirmationHTML(supportEmail: string): string {
    const userName = 'Valued User';
    const securityNote = supportEmail
      ? `<p style="margin: 0;"><strong>Security Notice:</strong> If you did not request this password reset, please contact our support team immediately at ${supportEmail}.</p>`
      : `<p style="margin: 0;"><strong>Security Notice:</strong> If you did not request this password reset, please contact our support team immediately.</p>`;

    return this.emailTemplateService.generateHTML({
      title: 'Password Reset Successful',
      greeting: `Hello ${userName}`,
      content: `
        <p>Your password has been successfully reset for your ${this.appConfig.name} account.</p>
      `,
      footerNote: securityNote,
      appName: this.appConfig.name,
    });
  }

  private generatePasswordResetConfirmationText(supportEmail: string): string {
    const userName = 'Valued User';
    const securityNote = supportEmail
      ? `Security Notice: If you did not request this password reset, please contact our support team immediately at ${supportEmail}.`
      : `Security Notice: If you did not request this password reset, please contact our support team immediately.`;

    return this.emailTemplateService.generateText({
      title: 'Password Reset Successful',
      greeting: `Hello ${userName}`,
      content: `
Your password has been successfully reset for your ${this.appConfig.name} account.

${securityNote}
      `,
      appName: this.appConfig.name,
    });
  }
}
