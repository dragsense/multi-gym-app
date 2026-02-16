import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { SessionBillingController } from './controllers/session-billing.controller';
import { Session } from './entities/session.entity';
import { OverrideRecurrenceSession } from './entities/override-recurrence-session.entity';
import { SessionBilling } from './entities/session-billing.entity';
import { SessionEmailService } from './services/session-email.service';
import { SessionEventListenerService } from './services/session-event-listener.service';
import { SessionProcessor } from './services/session.processor';
import { CrudModule } from '@/common/crud/crud.module';
import { ScheduleModule } from '@/common/schedule/schedule.module';
import { StaffModule } from '../staff/staff.module';
import { MembersModule } from '../members/members.module';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '@/common/notification/notification.module';
import { SessionNotificationService } from './services/session-notification.service';
import { SessionBillingService } from './services/session-billing.service';
import {SessionMiscService} from './services/session-misc.service'
import { UserSettingsModule } from '../user-settings/user-settings.module';

import { UserAvailabilityModule } from '../user-availability/user-availability.module';
import { StripeModule } from '../stripe/stripe.module';
import { BaseUserModule } from '@/common/base-user/base-users.module';
import { BillingsModule } from '../billings/billings.module';
import { LocationsModule } from '../locations/locations.module';
import { ServiceOffersModule } from '../service-offers/service-offers.module';
import { EmailTemplateService } from '@/common/email/email-template.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      OverrideRecurrenceSession,
      SessionBilling,
    ]),
    CrudModule,
    ScheduleModule,
    BullModule.registerQueue({ name: 'session' }),
    StaffModule,
    MembersModule,
    UsersModule,
    NotificationModule,
    UserSettingsModule,
    UserAvailabilityModule,
    StripeModule,
    BaseUserModule,
    BillingsModule,
    LocationsModule,
    ServiceOffersModule,
  ],
  controllers: [SessionsController, SessionBillingController],
  providers: [
    SessionsService,
    SessionEmailService,
    SessionEventListenerService,
    SessionNotificationService,
    SessionBillingService,
    SessionProcessor,
    SessionMiscService,
    EmailTemplateService,
  ],
  exports: [SessionsService, SessionEmailService, SessionBillingService,SessionMiscService],
})
export class SessionsModule {}
