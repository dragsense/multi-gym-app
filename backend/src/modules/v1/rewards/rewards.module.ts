import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';
import { RewardPoints } from './entities/reward-points.entity';
import { User } from '@/common/base-user/entities/user.entity';
import { ReferralLink } from '@/modules/v1/referral-links/entities/referral-link.entity';
import { CrudModule } from '@/common/crud/crud.module';
import { NotificationModule } from '@/common/notification/notification.module';
import { RewardNotificationService } from './services/reward-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RewardPoints, User, ReferralLink]),
    CrudModule,
    NotificationModule,
  ],
  controllers: [RewardsController],
  providers: [RewardsService, RewardNotificationService],
  exports: [RewardsService, RewardNotificationService],
})
export class RewardsModule {}
