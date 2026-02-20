import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscription } from '../entities/push-subscription.entity';
import { Notification } from '../entities/notification.entity';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private vapidKeysInitialized = false;

  constructor(
    private readonly entityRouterService: EntityRouterService,
    private readonly configService: ConfigService,
  ) {
    this.initializeVapidKeys();
  }

  /**
   * Initialize VAPID keys for web push
   */
  private initializeVapidKeys(): void {
    try {
      const vapidPublicKey =
        this.configService.get<string>('VAPID_PUBLIC_KEY');
      const vapidPrivateKey =
        this.configService.get<string>('VAPID_PRIVATE_KEY');
      const vapidEmail = this.configService.get<string>(
        'VAPID_EMAIL',
        'mailto:admin@example.com',
      );

      if (!vapidPublicKey || !vapidPrivateKey) {
        this.logger.warn(
          'VAPID keys not configured. Push notifications will not work.',
        );
        return;
      }

      webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
      this.vapidKeysInitialized = true;
      this.logger.log('✅ VAPID keys initialized for push notifications');
    } catch (error) {
      this.logger.error(
        `Failed to initialize VAPID keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Save push subscription for a user
   */
  async saveSubscription(
    userId: string,
    subscription: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    },
    userAgent?: string,
    deviceId?: string,
  ): Promise<PushSubscription> {
    const pushSubscriptionRepo = this.entityRouterService.getRepository<PushSubscription>(PushSubscription);

    this.logger.log(`📱 Saving push subscription for user ${userId}`);

    // Check if subscription with same endpoint already exists
    const existing = await pushSubscriptionRepo.findOne({
      where: { userId, endpoint: subscription.endpoint },
    });

    if (existing) {
      // Update existing subscription
      this.logger.log(`📱 Updating existing push subscription ${existing.id} for user ${userId}`);
      existing.keys = subscription.keys;
      existing.userAgent = userAgent;
      existing.deviceId = deviceId;
      return await pushSubscriptionRepo.save(existing);
    }

    // Create new subscription
    const pushSubscription = pushSubscriptionRepo.create({
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      userAgent,
      deviceId,
    });

    const saved = await pushSubscriptionRepo.save(pushSubscription);
    this.logger.log(`✅ Created new push subscription ${saved.id} for user ${userId}`);
    return saved;
  }

  /**
   * Remove push subscription
   */
  async removeSubscription(
    userId: string,
    endpoint: string,
  ): Promise<boolean> {
    const pushSubscriptionRepo = this.entityRouterService.getRepository<PushSubscription>(PushSubscription);
    const result = await pushSubscriptionRepo.delete({
      userId,
      endpoint,
    });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Remove all subscriptions for a user
   */
  async removeAllSubscriptions(userId: string): Promise<void> {
    const pushSubscriptionRepo = this.entityRouterService.getRepository<PushSubscription>(PushSubscription);
    await pushSubscriptionRepo.delete({ userId });
  }

  /**
   * Get all subscriptions for a user
   */
  async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    const pushSubscriptionRepo = this.entityRouterService.getRepository<PushSubscription>(PushSubscription);
    const subscriptions = await pushSubscriptionRepo.find({
      where: { userId },
    });

    this.logger.log(`📱 Found ${subscriptions.length} push subscription(s) for user ${userId}`);

    return subscriptions;
  }

  /**
   * Send push notification to a specific subscription
   */
  private async sendToSubscription(
    subscription: PushSubscription,
    notification: Notification,
  ): Promise<boolean> {
    if (!this.vapidKeysInitialized) {
      this.logger.warn(
        'VAPID keys not initialized. Cannot send push notification.',
      );
      return false;
    }

    try {
      const payload = JSON.stringify({
        title: notification.title,
        message: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
          id: notification.id,
          type: notification.type,
          priority: notification.priority,
          metadata: notification.metadata,
          url: `/notifications/${notification.id}`,
        },
      });

      // web-push accepts base64url strings directly
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
        payload,
      );

      this.logger.log(
        `✅ Push notification sent to subscription ${subscription.id}`,
      );
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // If subscription is invalid (410 Gone), remove it
      if (
        error instanceof Error &&
        'statusCode' in error &&
        (error as { statusCode: number }).statusCode === 410
      ) {
        this.logger.warn(
          `Subscription ${subscription.id} is invalid, removing it`,
        );
        const pushSubscriptionRepo = this.entityRouterService.getRepository<PushSubscription>(PushSubscription);
        await pushSubscriptionRepo.remove(subscription);
      } else {
        this.logger.error(
          `Failed to send push notification to subscription ${subscription.id}: ${errorMessage}`,
        );
      }

      return false;
    }
  }

  /**
   * Send push notification to all subscriptions for a user
   */
  async sendPushNotification(
    userId: string,
    notification: Notification,
  ): Promise<{ sent: number; failed: number }> {
    const subscriptions = await this.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      this.logger.log(
        `No push subscriptions found for user ${userId}`,
      );
      return { sent: 0, failed: 0 };
    }

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        this.sendToSubscription(subscription, notification),
      ),
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true,
    ).length;
    const failed = results.length - sent;

    this.logger.log(
      `📱 Push notifications: ${sent} sent, ${failed} failed for user ${userId}`,
    );

    return { sent, failed };
  }
}

