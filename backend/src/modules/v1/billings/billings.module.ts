import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { MailerService } from '@nestjs-modules/mailer';

import { BillingsService } from './billings.service';
import { BillingsController } from './billings.controller';
import { BillingInvoiceController } from './controllers/billing-invoice.controller';
import { BillingHistoryController } from './controllers/billing-history.controller';
import { Billing } from './entities/billing.entity';
import { BillingLineItem } from './entities/billing-line-item.entity';
import { BillingHistory } from './entities/billing-history.entity';
import { BillingEmailService } from './services/billing-email.service';
import { BillingEventListenerService } from './services/billing-event-listener.service';
import { BillingProcessor } from './services/billing.processor';
import { BillingInvoiceService } from './services/billing-invoice.service';
import { BillingHistoryService } from './services/billing-history.service';
import { CrudModule } from '@/common/crud/crud.module';
import { ScheduleModule } from '@/common/schedule/schedule.module';
import { UsersModule } from '../users/users.module';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { getJwtConfig } from '@/config/jwt.config';
import { StripeModule } from '../stripe/stripe.module';
import { PaymentAdapterModule } from '../payment-adapter/payment-adapter.module';
import { ProfilesModule } from '../users/profiles/profiles.module';
import { NotificationModule } from '@/common/notification/notification.module';
import { BillingNotificationService } from './services/billing-notification.service';
import { User } from '@/common/base-user/entities/user.entity';
import { UserSettingsModule } from '../user-settings/user-settings.module';
import { EmailTemplateService } from '@/common/email/email-template.service';
import { MembersModule } from '../members/members.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Billing, BillingLineItem, BillingHistory, User]),
    CrudModule,
    ScheduleModule,
    ProfilesModule,
    BullModule.registerQueue({ name: 'billing' }),
    UsersModule,
    MembersModule,
    StripeModule,
    PaymentAdapterModule,
    NotificationModule,
    UserSettingsModule,
    JwtModule.registerAsync({
      useFactory: getJwtConfig,
      inject: [ConfigService],
    }),
  ],
  exports: [BillingsService, BillingEmailService, BillingInvoiceService, BillingHistoryService],
  controllers: [BillingsController, BillingInvoiceController, BillingHistoryController],
  providers: [
    BillingsService,
    BillingEmailService,
    BillingEventListenerService,
    BillingNotificationService,
    BillingProcessor,
    BillingInvoiceService,
    BillingHistoryService,
    EmailTemplateService,
  ],
})
export class BillingsModule {}
