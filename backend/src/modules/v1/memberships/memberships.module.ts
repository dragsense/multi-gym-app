import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from '@/common/notification/notification.module';
import { MembershipNotificationService } from './services/membership-notification.service';

import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { Membership } from './entities/membership.entity';
import { MemberMembership } from './entities/member-membership.entity';
import { MemberMembershipHistory } from './entities/member-membership-history.entity';
import { MemberMembershipBilling } from './entities/member-membership-billing.entity';
import { MemberMembershipHistoryService } from './services/member-membership-history.service';
import { MemberMembershipBillingService } from './services/member-membership-billing.service';
import { MemberMembershipService } from './services/member-membership.service';
import { MemberMembershipEventListenerService } from './services/member-membership-event-listener.service';
import { MemberMembershipHistoryController } from './controllers/member-membership-history.controller';
import { MemberMembershipBillingController } from './controllers/member-membership-billing.controller';
import { MemberMembershipController } from './controllers/member-membership.controller';
import { CrudModule } from '@/common/crud/crud.module';
import { BillingsModule } from '../billings/billings.module';
import { PaymentAdapterModule } from '../payment-adapter/payment-adapter.module';
import { MembersModule } from '../members/members.module';
import { ScheduleModule } from '@/common/schedule/schedule.module';
import { ActionModule } from '@/common/helper/action.module';
import { DoorsModule } from '../locations/doors/doors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Membership, MemberMembership, MemberMembershipHistory, MemberMembershipBilling]),
    CrudModule,
    BillingsModule,
    PaymentAdapterModule,
    MembersModule,
    ScheduleModule,
    ActionModule,
    DoorsModule,
    NotificationModule,
  ],
  controllers: [MembershipsController, MemberMembershipHistoryController, MemberMembershipBillingController, MemberMembershipController],
  providers: [
    MembershipsService,
    MemberMembershipHistoryService,
    MemberMembershipBillingService,
    MemberMembershipService,
    MemberMembershipEventListenerService,
    MembershipNotificationService,
  ],
  exports: [MembershipsService, MemberMembershipHistoryService, MemberMembershipBillingService, MemberMembershipService],
})
export class MembershipsModule { }
