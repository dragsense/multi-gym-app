import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationSenderService } from './notification-sender.service';
import { PushNotificationService } from './services/push-notification.service';
import { SmsNotificationService } from './services/sms-notification.service';
import { SettingsModule } from '@/common/settings/settings.module';
import { User } from '@/common/base-user/entities/user.entity';
import { Profile } from '@/modules/v1/users/profiles/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, PushSubscription, User, Profile]),
    SettingsModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationSenderService,
    PushNotificationService,
    SmsNotificationService,
  ],
  exports: [
    NotificationService,
    NotificationSenderService,
    PushNotificationService,
    SmsNotificationService,
  ],
})
export class NotificationModule {}
