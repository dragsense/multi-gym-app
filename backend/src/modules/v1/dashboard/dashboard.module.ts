import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

// Entities
import { Session } from '@/modules/v1/sessions/entities/session.entity';
import { Billing } from '@/modules/v1/billings/entities/billing.entity';
import { BillingHistory } from '@/modules/v1/billings/entities/billing-history.entity';
import { User } from '@/common/base-user/entities/user.entity';
import { ReferralLink } from '@/modules/v1/referral-links/entities/referral-link.entity';
import { Member } from '@/modules/v1/members/entities/member.entity';
import { Checkin } from '@/modules/v1/checkins/entities/checkin.entity';
import { Membership } from '@/modules/v1/memberships/entities/membership.entity';
import { MemberMembership } from '@/modules/v1/memberships/entities/member-membership.entity';
import { Staff } from '../staff/entities/staff.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Session,
      Billing,
      BillingHistory,
      ReferralLink,
      Member,
      Staff,
      Checkin,
      Membership,
      MemberMembership,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}