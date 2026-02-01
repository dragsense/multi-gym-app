import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '@/common/base-user/entities/user.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { EmailTemplateService } from '@/common/email/email-template.service';

@Injectable()
export class PasswordResetEmailService {
  private readonly logger = new LoggerService(PasswordResetEmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  /**
   * Send password reset email with reset link
   */
  async sendPasswordResetLink(
    user: User,
    resetUrl: string,
  ): Promise<void> {
    try {
      const appConfig = this.configService.get('app');
      const appName = appConfig.name;
      const from = this.configService.get('mailer.from');
      const userName = user.firstName || 'User';

      const html = this.emailTemplateService.generateHTML({
        title: 'Password Reset Request',
        greeting: `Dear ${userName}`,
        content: `
          <p>We received a request to reset your password for account <strong>${user.email}</strong>.</p>
          <p>Click the button below to reset your password. This link will expire in 15 minutes.</p>
        `,
        actionButton: {
          text: 'Reset Your Password',
          url: resetUrl,
        },
        footerNote: `
          <p style="margin: 0;"><strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
          <p style="margin: 8px 0 0 0;">Can't click the button? Copy this link to your browser:</p>
          <p style="margin: 4px 0 0 0;"><a href="${resetUrl}" class="link" style="word-break: break-all; font-size: 12px;">${resetUrl}</a></p>
        `,
        appName,
      });

      const text = this.emailTemplateService.generateText({
        title: 'Password Reset Request',
        greeting: `Dear ${userName}`,
        content: `
We received a request to reset your password for account ${user.email}.

Click the link below to reset your password. This link will expire in 15 minutes.

${resetUrl}

Security Notice: If you didn't request this password reset, please ignore this email or contact support if you have concerns.
        `,
        appName,
      });

      await this.mailerService.sendMail({
        to: user.email,
        from,
        subject: `${appName} - Password Reset Instructions`,
        html,
        text,
      });

      this.logger.log(`Password reset email sent successfully to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${user.email}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetConfirmation(
    user: User,
    supportEmail?: string,
  ): Promise<void> {
    try {
      const appConfig = this.configService.get('app');
      const appName = appConfig.name;
      const from = this.configService.get('mailer.from');
      const userName = user.firstName || 'User';

      const securityNote = supportEmail
        ? `<p style="margin: 0;"><strong>Security Notice:</strong> If you did not request this password reset, please contact our support team immediately at ${supportEmail}.</p>`
        : `<p style="margin: 0;"><strong>Security Notice:</strong> If you did not request this password reset, please contact our support team immediately.</p>`;

      const html = this.emailTemplateService.generateHTML({
        title: 'Password Reset Successful',
        greeting: `Hello ${userName}`,
        content: `
          <p>Your password has been successfully reset for your ${appName} account.</p>
        `,
        footerNote: securityNote,
        appName,
      });

      const text = this.emailTemplateService.generateText({
        title: 'Password Reset Successful',
        greeting: `Hello ${userName}`,
        content: `
Your password has been successfully reset for your ${appName} account.

${supportEmail ? `Security Notice: If you did not request this password reset, please contact our support team immediately at ${supportEmail}.` : 'Security Notice: If you did not request this password reset, please contact our support team immediately.'}
        `,
        appName,
      });

      await this.mailerService.sendMail({
        to: user.email,
        from,
        subject: `Password Reset Successful - ${appName}`,
        html,
        text,
      });

      this.logger.log(`Password reset confirmation sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset confirmation to ${user.email}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
