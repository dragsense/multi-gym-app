import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '@/common/notification/notification.service';
import {
  ENotificationPriority,
  ENotificationType,
} from '@shared/enums/notification.enum';
import { RewardPoints } from '../entities/reward-points.entity';

@Injectable()
export class RewardNotificationService {
  private readonly logger = new Logger(RewardNotificationService.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Send notification when reward points are earned
   */
  async notifyRewardEarned(reward: RewardPoints): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'Reward Points Earned!',
        message: `Congratulations! You've earned ${reward.points} reward points. ${reward.description || ''}`,
        type: ENotificationType.SUCCESS,
        priority: ENotificationPriority.NORMAL,
        entityId: reward.user?.id,
        entityType: 'reward',
        emailSubject: `You've Earned ${reward.points} Reward Points!`,
        metadata: {
          action: 'reward_earned',
          rewardId: reward.id,
          points: reward.points,
          type: reward.type,
        },
      });

      this.logger.log(
        `✅ Notification sent for reward ${reward.id} to user ${reward.user?.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for reward ${reward.id}: ${errorMessage}`,
      );
    }
  }
}
