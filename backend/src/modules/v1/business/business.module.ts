import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CrudModule } from '@/common';
import { User } from '@/common/base-user/entities/user.entity';

import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';

import { Business } from './entities/business.entity';
import { Subscription } from './subscription/entities/subscription.entity';

import { BusinessSubscriptionBilling } from './entities/business-susbscription-billing.entity';
import { BusinessSubscriptionBillingService } from './services/business-subscription-billing.service';
import { BusinessSubscriptionBillingController } from './controllers/business-subscription-billing.controller';
import { BusinessSignupService } from './services/business-signup.service';
import { BusinessSubscriptionController } from './controllers/business-subscription.controller';
import { BusinessSubscriptionHistoryController } from './controllers/business-subscription-history.controller';
import { BusinessSubscription } from './entities/business-subscription.entity';
import { BusinessSubscriptionHistory } from './entities/business-subscription-history.entity';
import { BusinessSubscriptionService } from './services/business-subscription.service';
import { BusinessSubscriptionHistoryService } from './services/business-subscription-history.service';
import { BusinessSubscriptionEventListenerService } from './services/business-subscription-event-listener.service';
import { BusinessEmailService } from './services/business-email.service';
import { BusinessEventListenerService } from './services/business-event-listener.service';
import { BusinessTheme } from './entities/business-theme.entity';
import { BusinessThemeService } from './services/business-theme.service';
import { BusinessThemeController } from './controllers/business-theme.controller';
import { Billing } from '../billings/entities/billing.entity';

import { BillingsModule } from '../billings/billings.module';
import { PaymentProcessorsModule } from '@/common/payment-processors/payment-processors.module';
import { ScheduleModule } from '@/common/schedule/schedule.module';
import { ActionModule } from '@/common/helper/action.module';
import { StripeModule } from '../stripe/stripe.module';
import { SubscriptionsModule } from './subscription/subscriptions.module';
import { Profile } from '../users/profiles/entities/profile.entity';
import { BaseUsersService } from '@/common/base-user/base-users.service';
import { DatabaseModule } from '@/common/database/database.module';
import { TokenService } from '../auth/services/tokens.service';
import { EmailTemplateService } from '@/common/email/email-template.service';
import { UsersModule } from '../users/users.module';
import { FileUploadModule } from '@/common/file-upload/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      Subscription,
      BusinessSubscriptionBilling,
      BusinessSubscription,
      BusinessSubscriptionHistory,
      BusinessTheme,
      Billing,
      User,
      Profile,
      
    ]),
    CrudModule,
    BillingsModule,
    PaymentProcessorsModule,
    StripeModule,
    SubscriptionsModule,
    ScheduleModule,
    ActionModule,
    DatabaseModule,
    UsersModule,
    FileUploadModule,
  ],
  controllers: [
    BusinessController,
    BusinessSubscriptionBillingController,
    BusinessSubscriptionController,
    BusinessSubscriptionHistoryController,
    BusinessThemeController,
  ],
  providers: [
    BusinessService,
    BusinessSubscriptionBillingService,
    BusinessSignupService,
    BusinessSubscriptionService,
    BusinessSubscriptionHistoryService,
    BusinessSubscriptionEventListenerService,
    BusinessEmailService,
    BusinessEventListenerService,
    BusinessThemeService,
    BaseUsersService,
    TokenService,
    EmailTemplateService,
  ],
  exports: [
    BusinessService,
    BusinessSubscriptionBillingService,
    BusinessSignupService,
    BusinessSubscriptionService,
    BusinessSubscriptionHistoryService,
    BusinessEmailService,
  ],
})
export class BusinessModule { }
