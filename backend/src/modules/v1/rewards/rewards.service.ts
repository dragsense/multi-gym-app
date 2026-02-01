import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { CrudService } from '@/common/crud/crud.service';
import { RewardPoints } from './entities/reward-points.entity';
import { ReferralLink } from '@/modules/v1/referral-links/entities/referral-link.entity';
import { ERewardType, ERewardStatus } from './enums/reward.enum';
import { EReferralLinkStatus } from '@shared/enums/referral-link.enum';
import { ServerGateway } from '@/common/gateways/server.gateway';
import { RewardNotificationService } from './services/reward-notification.service';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class RewardsService extends CrudService<RewardPoints> {
  constructor(
    @InjectRepository(RewardPoints)
    private readonly rewardPointsRepository: Repository<RewardPoints>,
    protected readonly entityRouterService: EntityRouterService,
    moduleRef: ModuleRef,
    private serverGateway: ServerGateway,
    private readonly rewardNotificationService: RewardNotificationService,
  ) {
    super(rewardPointsRepository, moduleRef);
  }

  async processReferralSignup(
    referredUserId: string,
    referralCode: string,
  ): Promise<void> {
    // Find the referral link
    const referralLinkRepo = this.entityRouterService.getRepository<ReferralLink>(ReferralLink);
    const referralLink = await referralLinkRepo.findOne({
      where: {
        referralCode,
        expiresAt: MoreThan(new Date()),
        status: EReferralLinkStatus.ACTIVE,
      },
      relations: ['createdBy'],
    });

    if (
      !referralLink ||
      (referralLink.maxUses || 0) <= referralLink.currentUses
    ) {
      this.logger.error(`Invalid referral code: ${referralCode}`);
      return; // Invalid referral code, no reward
    }

    const referrer = referralLink.createdBy;

    // Calculate reward points based on referral count
    const referralCount = referralLink.referralCount + 1;
    let rewardPoints = 0;

    // Reward structure: 10 points for first referral, 15 for second, 25 for third and beyond
    if (referralCount === 1) {
      rewardPoints = 10;
    } else if (referralCount === 2) {
      rewardPoints = 15;
    } else if (referralCount >= 3) {
      rewardPoints = 25;
    }

    if (rewardPoints > 0) {
      // Create reward points record
      const reward = await this.create(
        {
          points: rewardPoints,
          type: ERewardType.REFERRAL_BONUS,
          status: ERewardStatus.ACTIVE,
          description: `Referral bonus for bringing ${referralCount} user${referralCount > 1 ? 's' : ''}`,
          user: referrer,
          referralLink,
          referredUserId,
          isRedeemable: true,
        },
        {
          afterCreate: async (savedEntity, manager) => {
            await manager.update(ReferralLink, referralLink.id, {
              referralCount: referralCount,
              currentUses: referralLink.currentUses + 1,
            });
          },
        },
      );

      // Send notification
      try {
        await this.rewardNotificationService.notifyRewardEarned(reward);
      } catch (error) {
        console.error('Failed to send reward notification:', error);
      }

      this.serverGateway.emitToClient(`user_${referrer.id}`, 'rewardsUpdated', {
        message: `You have received ${rewardPoints} points for referring ${referralCount} user${referralCount > 1 ? 's' : ''}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getUserRewardPoints(userId: string): Promise<number> {
    const result = await this.rewardPointsRepository
      .createQueryBuilder('reward')
      .select('SUM(reward.points - reward.redeemedPoints)', 'total')
      .where('reward.userId = :userId', { userId })
      .andWhere('reward.status = :status', { status: ERewardStatus.ACTIVE })
      .getRawOne();

    return parseInt(result.total) || 0;
  }

  async getUserRewards(userId: string): Promise<RewardPoints[]> {
    const repository = this.getRepository();
    return await repository.find({
      where: { user: { id: userId } },
      relations: ['referralLink'],
      order: { createdAt: 'DESC' },
    });
  }
}
