import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import { Notification } from '../entities/notification.entity';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { User } from '@/common/base-user/entities/user.entity';
import { Profile } from '@/modules/v1/users/profiles/entities/profile.entity';

@Injectable()
export class SmsNotificationService {
  private readonly logger = new Logger(SmsNotificationService.name);
  private twilioClient: twilio.Twilio | null = null;

  constructor(
    private readonly entityRouterService: EntityRouterService,
    private readonly configService: ConfigService,
  ) {
    this.initializeTwilioClient();
  }

  /**
   * Initialize Twilio client
   */
  private initializeTwilioClient(): void {
    try {
      const accountSid = this.configService.get<string>('twilio.accountSid');
      const authToken = this.configService.get<string>('twilio.authToken');

      if (!accountSid || !authToken) {
        this.logger.warn(
          'Twilio credentials not configured. SMS notifications will not work.',
        );
        return;
      }

      this.twilioClient = twilio(accountSid, authToken);
      this.logger.log('✅ Twilio client initialized for SMS notifications');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Twilio client: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Format phone number to E.164 format required by Twilio
   * Handles common formats like:
   * - 03066864003 (Pakistani local) -> +923066864003
   * - +923066864003 (already E.164) -> +923066864003
   * - 923066864003 (without +) -> +923066864003
   */
  private formatPhoneNumberToE164(phoneNumber: string): string | null {
    if (!phoneNumber) {
      return null;
    }

    // Remove all spaces, dashes, and parentheses
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // If already in E.164 format (starts with +), return as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // Handle Pakistani numbers (starting with 0)
    if (cleaned.startsWith('0')) {
      // Remove leading 0 and add +92
      cleaned = cleaned.substring(1);
      return `+92${cleaned}`;
    }

    // If starts with country code without +
    if (cleaned.startsWith('92') && cleaned.length >= 12) {
      return `+${cleaned}`;
    }

    // If starts with country code for other countries (US, UK, etc.)
    if (cleaned.length >= 10 && !cleaned.startsWith('0')) {
      // Assume it's a valid number, just add +
      return `+${cleaned}`;
    }

    // If we can't determine format, return null
    this.logger.warn(
      `Unable to format phone number to E.164: ${phoneNumber}`,
    );
    return null;
  }

  /**
   * Get user phone number from profile
   */
  private async getUserPhoneNumber(userId: string): Promise<string | null> {
    try {
      const userRepo = this.entityRouterService.getRepository<User>(User);
      const profileRepo = this.entityRouterService.getRepository<Profile>(Profile);

      const user = await userRepo.findOne({
        where: { id: userId },
        select: ['id'],
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found`);
        return null;
      }

      const profile = await profileRepo.findOne({
        where: { userId: user.id },
      });

      if (!profile || !profile.phoneNumber) {
        this.logger.warn(`No phone number found for user ${userId}`);
        return null;
      }

      // Format phone number to E.164 format
      const formattedNumber = this.formatPhoneNumberToE164(profile.phoneNumber);
      
      if (!formattedNumber) {
        this.logger.warn(
          `Invalid phone number format for user ${userId}: ${profile.phoneNumber}`,
        );
        return null;
      }

      return formattedNumber;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to get phone number for user ${userId}: ${errorMessage}`,
      );
      return null;
    }
  }

  /**
   * Format SMS message from notification
   */
  private formatSmsMessage(notification: Notification): string {
    // For billing notifications, create a concise SMS message
    if (notification.entityType === 'billing') {
      const metadata = notification.metadata as Record<string, unknown>;
      const action = metadata?.action as string;

      switch (action) {
        case 'billing_created':
          return `${notification.title}: ${notification.message}`;
        case 'billing_updated':
          return `${notification.title}: ${notification.message}`;
        case 'billing_paid':
          return `${notification.title}: ${notification.message}`;
        case 'billing_deleted':
          return `${notification.title}: ${notification.message}`;
        default:
          return `${notification.title}: ${notification.message}`;
      }
    }

    // Default format for other notification types
    return `${notification.title}: ${notification.message}`;
  }

  /**
   * Send SMS notification to a user
   */
  async sendSmsNotification(
    userId: string,
    notification: Notification,
  ): Promise<boolean> {
    if (!this.twilioClient) {
      this.logger.warn(
        'Twilio client not initialized. Cannot send SMS notification.',
      );
      return false;
    }

    // Declare phoneNumber outside try block so it's accessible in catch block
    let phoneNumber: string | null = null;

    try {
      phoneNumber = await this.getUserPhoneNumber(userId);

      if (!phoneNumber) {
        this.logger.warn(
          `Cannot send SMS to user ${userId}: no phone number found`,
        );
        return false;
      }

      const fromNumber = this.configService.get<string>('twilio.phoneNumber');

      if (!fromNumber) {
        this.logger.error('Twilio phone number not configured');
        return false;
      }

      const message = this.formatSmsMessage(notification);

      // Truncate message to 1600 characters (Twilio's limit is 1600 for long messages)
      const truncatedMessage =
        message.length > 1600 ? message.substring(0, 1597) + '...' : message;

      const result = await this.twilioClient.messages.create({
        body: truncatedMessage,
        from: fromNumber,
        to: phoneNumber,
      });

      this.logger.log(
        `✅ SMS notification sent to ${phoneNumber} for user ${userId} (SID: ${result.sid})`,
      );

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Handle specific Twilio errors
      if (error instanceof Error && 'code' in error) {
        const twilioError = error as { code: number; message: string };
        
        // Handle Twilio daily limit error (trial accounts)
        if (twilioError.code === 63038) {
          this.logger.warn(
            `⚠️ Twilio daily message limit reached (${twilioError.code}): ${twilioError.message}. SMS notification for user ${userId}${phoneNumber ? ` (${phoneNumber})` : ''} was not sent. Please upgrade your Twilio account or wait until the limit resets.`,
          );
        } else {
          this.logger.error(
            `❌ Twilio error (${twilioError.code}): ${twilioError.message} - Failed to send SMS to user ${userId}${phoneNumber ? ` (${phoneNumber})` : ''}`,
          );
        }
      } else {
        this.logger.error(
          `❌ Failed to send SMS notification to user ${userId}${phoneNumber ? ` (${phoneNumber})` : ''}: ${errorMessage}`,
        );
      }

      return false;
    }
  }

}
