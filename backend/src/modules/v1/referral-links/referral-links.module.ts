import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReferralLinksService } from './referral-links.service';
import { ReferralLinksController } from './referral-links.controller';
import { ReferralLink } from './entities/referral-link.entity';
import { CrudModule } from '@/common/crud/crud.module';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '@/common/notification/notification.module';
import { ReferralLinkNotificationService } from './services/referral-link-notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReferralLink]),
    CrudModule,
    UsersModule,
    NotificationModule,
  ],
  controllers: [ReferralLinksController],
  providers: [ReferralLinksService, ReferralLinkNotificationService],
  exports: [ReferralLinksService, ReferralLinkNotificationService],
})
export class ReferralLinksModule {}
