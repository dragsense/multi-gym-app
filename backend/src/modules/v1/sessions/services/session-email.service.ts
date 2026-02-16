import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Session } from '../entities/session.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { EmailTemplateService } from '@/common/email/email-template.service';

export enum ReminderType {
  CONFIRMATION = 'confirmation',
  REMINDER = 'reminder',
  DELETED = 'deleted',
  STATUS_UPDATE = 'status_update',
}

export interface SessionEmailContext {
  session: Session;
  recipientEmail?: string;
  recipientName?: string;
  reminderType?: ReminderType;
  sendBefore?: number; // minutes before session
}

interface SessionEmailTemplateData {
  session: Session;
  recipientEmail: string;
  recipientName: string;
  loginUrl: string;
  sessionUrl: string;
  reminderType: ReminderType;
  sendBefore?: number;
}

@Injectable()
export class SessionEmailService {
  private readonly logger = new LoggerService(SessionEmailService.name);
  private readonly appConfig: any;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    this.appConfig = this.configService.get('app');
  }

  /**
   * Send session confirmation email when session is created
   */
  async sendSessionConfirmation(
    session: Session,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: SessionEmailContext = {
        session,
        reminderType: ReminderType.CONFIRMATION,
        recipientEmail,
        recipientName,
      };

      await this.sendSessionEmail(context);
      this.logger.log(
        `Session confirmation email sent for session: ${session.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send session confirmation email for session ${session.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send session reminder email
   */
  async sendSessionReminder(
    session: Session,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: SessionEmailContext = {
        session,
        reminderType: ReminderType.REMINDER,
        recipientEmail,
        recipientName,
      };

      await this.sendSessionEmail(context);
      this.logger.log(
        `Session reminder email sent for session: ${session.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send session reminder email for session ${session.id}:`,
        error,
      );
      throw error;
    }
  }

  async sendSessionStatusUpdate(
    session: Session,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: SessionEmailContext = {
        session,
        reminderType: ReminderType.STATUS_UPDATE,
        recipientEmail,
        recipientName,
      };

      await this.sendSessionEmail(context);
      this.logger.log(
        `Session status update email sent for session: ${session.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send session status update email for session ${session.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send session reminder email
   */
  async sendSessionDeleted(
    session: Session,
    recipientEmail: string,
    recipientName: string,
    sendBefore?: number,
  ): Promise<void> {
    try {
      const context: SessionEmailContext = {
        session,
        reminderType: ReminderType.DELETED,
        recipientEmail,
        recipientName,
      };

      await this.sendSessionEmail(context);
      this.logger.log(
        `Session deleted email sent for session: ${session.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send session deleted email for session ${session.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generic method to send session-related emails
   */
  private async sendSessionEmail(context: SessionEmailContext): Promise<void> {
    try {
      const {
        session,
        recipientEmail,
        recipientName,
        reminderType,
        sendBefore,
      } = context;

      if (!recipientEmail) {
        this.logger.warn(`No recipient email found for session ${session.id}`);
        return;
      }

      const templateData: SessionEmailTemplateData = {
        session,
        recipientEmail,
        recipientName: recipientName || 'User',
        loginUrl: `${this.appConfig.frontendUrl}/login`,
        sessionUrl: `${this.appConfig.frontendUrl}/sessions`,
        reminderType: reminderType || ReminderType.CONFIRMATION,
        sendBefore,
      };

      const emailConfig = this.getEmailConfig(
        reminderType || ReminderType.CONFIRMATION,
      );

      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: emailConfig.subject,
        html: this.generateSessionEmailHTML(
          templateData,
          reminderType || ReminderType.CONFIRMATION,
        ),
        text: this.generateSessionEmailText(
          templateData,
          reminderType || ReminderType.CONFIRMATION,
        ),
      });
    } catch (error) {
      this.logger.error(`Failed to send session email:`, error);
      throw error;
    }
  }

  /**
   * Get email configuration based on reminder type
   */
  private getEmailConfig(reminderType: ReminderType) {
    const baseUrl = this.appConfig.frontendUrl;

    switch (reminderType) {
      case ReminderType.CONFIRMATION:
        return {
          subject: 'Session Confirmation - Your Session is Scheduled',
          template: 'session-confirmation',
        };

      case ReminderType.REMINDER:
        return {
          subject: 'Session Reminder - Your Session is Coming Up',
          template: 'session-reminder',
        };

      case ReminderType.STATUS_UPDATE:
        return {
          subject: 'Session Status Update - Your Session Status has Changed',
          template: 'session-status-update',
        };

      case ReminderType.DELETED:
        return {
          subject: 'Session Deleted - Your Session has been Deleted',
          template: 'session-deleted',
        };

      default:
        return {
          subject: 'Session Update',
          template: 'session-default',
        };
    }
  }

  /**
   * Generate HTML email template for session emails
   */
  private generateSessionEmailHTML(
    data: SessionEmailTemplateData,
    reminderType: ReminderType,
  ): string {
    const { session, recipientName, sessionUrl, sendBefore } = data;
    const appName = this.appConfig.name;
    const sessionDate = new Date(session.startDateTime).toLocaleDateString();
    const sessionTime = new Date(session.startDateTime).toLocaleTimeString();
    const sessionEndTime = session.endDateTime
      ? new Date(session.endDateTime).toLocaleTimeString()
      : 'TBD';
    const duration = session.endDateTime
      ? Math.round((new Date(session.endDateTime).getTime() - new Date(session.startDateTime).getTime()) / (1000 * 60))
      : session.duration || 'TBD';

    const getEmailContent = () => {
      switch (reminderType) {
        case ReminderType.CONFIRMATION:
          return {
            title: 'Session Confirmed',
            message: `Your session "${session.title}" has been successfully scheduled.`,
            actionText: 'View Session Details',
            actionUrl: sessionUrl,
            additionalInfo: 'Please arrive on time and bring any necessary materials.',
          };
        case ReminderType.REMINDER:
          return {
            title: 'Session Reminder',
            message: `This is a reminder that your session "${session.title}" is coming up soon.`,
            actionText: 'View Session Details',
            actionUrl: sessionUrl,
            additionalInfo: sendBefore
              ? `This reminder is sent ${sendBefore} minutes before your session.`
              : 'Please arrive on time.',
          };
        case ReminderType.STATUS_UPDATE:
          return {
            title: 'Session Status Update',
            message: `Your session "${session.title}" status has been updated.`,
            actionText: 'View Session Details',
            actionUrl: sessionUrl,
            additionalInfo: 'Please check the updated details for any changes.',
          };
        case ReminderType.DELETED:
          return {
            title: 'Session Deleted',
            message: `Your session "${session.title}" has been deleted.`,
            actionText: 'View Other Sessions',
            actionUrl: sessionUrl,
            additionalInfo: 'If you have any questions, please contact your trainer.',
          };
        default:
          return {
            title: 'Session Update',
            message: `Your session "${session.title}" has been updated.`,
            actionText: 'View Session Details',
            actionUrl: sessionUrl,
            additionalInfo: 'Please check the details for any changes.',
          };
      }
    };

    const content = getEmailContent();

    const sessionDetails = `
      <div class="info-box">
        <p style="margin: 0 0 8px 0;"><strong>Title:</strong> ${session.title}</p>
        <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${sessionDate}</p>
        <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${sessionTime} - ${sessionEndTime}</p>
        <p style="margin: 0 0 8px 0;"><strong>Time Zone:</strong> UTC</p>
        <p style="margin: 0 0 8px 0;"><strong>Duration:</strong> ${duration} minutes</p>
        ${session.description ? `<p style="margin: 0 0 8px 0;"><strong>Description:</strong> ${session.description}</p>` : ''}
        ${session.location ? `<p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${session.location}</p>` : ''}
        <p style="margin: 0;"><strong>Status:</strong> ${session.status || 'Scheduled'}</p>
      </div>
    `;

    return this.emailTemplateService.generateHTML({
      title: content.title,
      greeting: `Dear ${recipientName}`,
      content: `
        <p>${content.message}</p>
        ${sessionDetails}
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
   * Generate text email template for session emails
   */
  private generateSessionEmailText(
    data: SessionEmailTemplateData,
    reminderType: ReminderType,
  ): string {
    const { session, recipientName, sessionUrl, sendBefore } = data;
    const appName = this.appConfig.name;
    const sessionDate = new Date(session.startDateTime).toLocaleDateString();
    const sessionTime = new Date(session.startDateTime).toLocaleTimeString();
    const sessionEndTime = session.endDateTime
      ? new Date(session.endDateTime).toLocaleTimeString()
      : 'TBD';
    const duration = session.endDateTime
      ? Math.round((new Date(session.endDateTime).getTime() - new Date(session.startDateTime).getTime()) / (1000 * 60))
      : session.duration || 'TBD';

    const getEmailContent = () => {
      switch (reminderType) {
        case ReminderType.CONFIRMATION:
          return {
            title: 'Session Confirmed',
            message: `Your session "${session.title}" has been successfully scheduled.`,
            additionalInfo: 'Please arrive on time and bring any necessary materials.',
          };
        case ReminderType.REMINDER:
          return {
            title: 'Session Reminder',
            message: `This is a reminder that your session "${session.title}" is coming up soon.`,
            additionalInfo: sendBefore
              ? `This reminder is sent ${sendBefore} minutes before your session.`
              : 'Please arrive on time.',
          };
        case ReminderType.STATUS_UPDATE:
          return {
            title: 'Session Status Update',
            message: `Your session "${session.title}" status has been updated.`,
            additionalInfo: 'Please check the updated details for any changes.',
          };
        case ReminderType.DELETED:
          return {
            title: 'Session Deleted',
            message: `Your session "${session.title}" has been deleted.`,
            additionalInfo: 'If you have any questions, please contact your trainer.',
          };
        default:
          return {
            title: 'Session Update',
            message: `Your session "${session.title}" has been updated.`,
            additionalInfo: 'Please check the details for any changes.',
          };
      }
    };

    const content = getEmailContent();

    const sessionDetailsText = `
Title: ${session.title}
Date: ${sessionDate}
Time: ${sessionTime} - ${sessionEndTime}
Duration: ${duration} minutes
${session.description ? `Description: ${session.description}` : ''}
${session.location ? `Location: ${session.location}` : ''}
Status: ${session.status || 'Scheduled'}
    `;

    return this.emailTemplateService.generateText({
      title: content.title,
      greeting: `Dear ${recipientName}`,
      content: `
${content.message}

Session Details:
${sessionDetailsText}
${content.additionalInfo ? `\n${content.additionalInfo}` : ''}
      `,
      actionButton: {
        text: 'View Session Details',
        url: sessionUrl,
      },
      appName,
    });
  }
}
