import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '@/common/notification/notification.service';
import {
  ENotificationPriority,
  ENotificationType,
} from '@shared/enums/notification.enum';
import { ReferralLink } from '../entities/referral-link.entity';

@Injectable()
export class ReferralLinkNotificationService {
  private readonly logger = new Logger(ReferralLinkNotificationService.name);

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Send notification when referral link is created
   */
  async notifyReferralLinkCreated(referralLink: ReferralLink): Promise<void> {
    try {
      const userId = referralLink.createdBy?.id;
      if (!userId) return;

      await this.notificationService.createNotification({
        title: 'Referral Link Created',
        message: `Your referral link has been created successfully. Share it with others to earn rewards!`,
        type: ENotificationType.SUCCESS,
        priority: ENotificationPriority.NORMAL,
        entityId: userId,
        entityType: 'referral_link',
        emailSubject: 'Your Referral Link is Ready!',
        metadata: {
          action: 'referral_link_created',
          referralLinkId: referralLink.id,
          referralCode: referralLink.referralCode,
          linkUrl: referralLink.linkUrl,
        },
      });

      this.logger.log(
        `✅ Notification sent for referral link ${referralLink.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for referral link ${referralLink.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when referral link is used
   */
  async notifyReferralLinkUsed(referralLink: ReferralLink, referredUserName?: string): Promise<void> {
    try {
      const userId = referralLink.createdBy?.id;
      if (!userId) return;

      const userName = referredUserName || 'someone';

      await this.notificationService.createNotification({
        title: 'Referral Link Used!',
        message: `Great news! ${userName} signed up using your referral link. You'll receive reward points once they complete their registration.`,
        type: ENotificationType.SUCCESS,
        priority: ENotificationPriority.NORMAL,
        entityId: userId,
        entityType: 'referral_link',
        emailSubject: 'Your Referral Link Was Used!',
        metadata: {
          action: 'referral_link_used',
          referralLinkId: referralLink.id,
          referralCode: referralLink.referralCode,
          currentUses: referralLink.currentUses,
        },
      });

      this.logger.log(
        `✅ Notification sent for referral link usage ${referralLink.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for referral link usage ${referralLink.id}: ${errorMessage}`,
      );
    }
  }
}

