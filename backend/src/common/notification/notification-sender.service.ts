import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from '@/common/settings/settings.service';
import { Notification } from './entities/notification.entity';
import { PushNotificationService } from './services/push-notification.service';
import { User } from '@/common/base-user/entities/user.entity';
import { ServerGateway } from '@/common/gateways/server.gateway';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class NotificationSenderService {
  private readonly logger = new Logger(NotificationSenderService.name);

  constructor(
    private readonly serverGateway: ServerGateway,
    private readonly settingsService: SettingsService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly entityRouterService: EntityRouterService,
  ) {}

  /**
   * Get user notification preferences
   */
  private async getUserNotificationPreferences(entityId: string): Promise<{
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
  }> {
    try {
      const settings = await this.settingsService.getSettings(entityId);

      const notifications = ((settings?.notifications as
        | {
            emailEnabled?: boolean;
            smsEnabled?: boolean;
            pushEnabled?: boolean;
            inAppEnabled?: boolean;
          }
        | undefined) || {}) as {
        emailEnabled?: boolean;
        smsEnabled?: boolean;
        pushEnabled?: boolean;
        inAppEnabled?: boolean;
      };

      return {
        emailEnabled: notifications.emailEnabled ?? true, // Default to true
        smsEnabled: notifications.smsEnabled ?? false,
        pushEnabled: notifications.pushEnabled ?? false,
        inAppEnabled: notifications.inAppEnabled ?? true, // Default to true
      };
    } catch {
      this.logger.warn(
        `Failed to get notification preferences for user ${entityId}, using defaults`,
      );
      // Return defaults if settings not found
      return {
        emailEnabled: false,
        smsEnabled: false,
        pushEnabled: false,
        inAppEnabled: true,
      };
    }
  }

  /**
   * Send notification via WebSocket (in-app)
   */
  private sendInAppNotification(
    entityId: string,
    notification: Notification,
  ): void {
    try {
      const userRoom = `user_${entityId}`;

      this.serverGateway.emitToClient(userRoom, 'notification', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        isRead: notification.isRead,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      });

      this.logger.log(
        `✅ In-app notification sent to user ${entityId} via WebSocket room ${userRoom}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send in-app notification to user ${entityId}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification via Email
   */
  private async sendEmailNotification(
    entityId: string,
    notification: Notification,
  ): Promise<void> {
    try {
      // Get user email
      const userRepo = this.entityRouterService.getRepository<User>(User);
      const user = await userRepo.findOne({
        where: { id: entityId },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      if (!user || !user.email) {
        this.logger.warn(
          `User ${entityId} not found or has no email, skipping email notification`,
        );
        return;
      }

      const appName = this.configService.get<string>('app.name', 'App');
      const from = this.configService.get<string>('mailer.from');

      // Use provided subject or default to notification title
      const subject = notification.emailSubject || notification.title;

      // Helper function to escape HTML entities
      const escapeHtml = (text: string): string => {
        const map: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
      };

      // Use provided HTML content or generate simple HTML from message
      let html: string;
      if (notification.htmlContent) {
        html = notification.htmlContent;
      } else {
        // Generate simple HTML email with escaped content
        const escapedTitle = escapeHtml(notification.title);
        const escapedMessage = notification.message
          .split('\n')
          .map((line) => escapeHtml(line))
          .join('<br>');

        html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; border: 1px solid #e5e7eb;">
              <h2 style="color: #111827; margin-bottom: 20px;">${escapedTitle}</h2>
              <div style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                ${escapedMessage}
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} ${escapeHtml(appName)}. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `;
      }

      // Generate plain text version
      const text = notification.message;

      await this.mailerService.sendMail({
        to: user.email,
        from,
        subject,
        html,
        text,
      });

      this.logger.log(
        `📧 Email notification sent to ${user.email} for notification ${notification.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send email notification to user ${entityId}: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Send notification via SMS (placeholder for future implementation)
   */
  private async sendSmsNotification(
    entityId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _notification: Notification,
  ): Promise<void> {
    // TODO: Implement SMS notification service
    // Using void await to satisfy linter for async method
    await Promise.resolve();
    this.logger.log(
      `📱 SMS notification queued for user ${entityId} (not implemented yet)`,
    );
  }

  /**
   * Send notification via Push
   */
  private async sendPushNotification(
    entityId: string,
    notification: Notification,
  ): Promise<void> {
    try {
      const result = await this.pushNotificationService.sendPushNotification(
        entityId,
        notification,
      );

      if (result.sent > 0) {
        this.logger.log(
          `🔔 Push notification sent to ${result.sent} device(s) for user ${entityId}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send push notification to user ${entityId}: ${errorMessage}`,
      );
      throw error;
    }
  }

  /**
   * Send notification through all enabled channels
   */
  async sendNotification(notification: Notification): Promise<{
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  }> {
    if (!notification.entityId) {
      this.logger.warn(
        `Notification ${notification.id} has no entityId, skipping send`,
      );
      return { inApp: false, email: false, sms: false, push: false };
    }

    const preferences = await this.getUserNotificationPreferences(
      notification.entityId,
    );

    const results = {
      inApp: false,
      email: false,
      sms: false,
      push: false,
    };

    // Send via in-app (WebSocket)
    if (preferences.inAppEnabled) {
      try {
        this.sendInAppNotification(notification.entityId, notification);
        results.inApp = true;
      } catch (error) {
        this.logger.error(
          `Failed to send in-app notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Send via email
    if (preferences.emailEnabled) {
      try {
        await this.sendEmailNotification(notification.entityId, notification);
        results.email = true;
      } catch (error) {
        this.logger.error(
          `Failed to send email notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Send via SMS
    if (preferences.smsEnabled) {
      try {
        await this.sendSmsNotification(notification.entityId, notification);
        results.sms = true;
      } catch (error) {
        this.logger.error(
          `Failed to send SMS notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Send via push
    if (preferences.pushEnabled) {
      try {
        await this.sendPushNotification(notification.entityId, notification);
        results.push = true;
      } catch (error) {
        this.logger.error(
          `Failed to send push notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return results;
  }
}
