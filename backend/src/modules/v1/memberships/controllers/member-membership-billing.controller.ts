import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { MemberMembershipBillingService } from '../services/member-membership-billing.service';
import {
  CreateMemberMembershipPaymentIntentDto,
  MemberMembershipBillingDto,
} from '@shared/dtos';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { Timezone } from '@/decorators/timezone.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { AuthUser } from '@/decorators/user.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Member Membership Billing')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('member-membership-billings')
export class MemberMembershipBillingController {
  constructor(private readonly memberMembershipBillingService: MemberMembershipBillingService) {}


  
  @ApiOperation({ summary: 'Create member membership with payment intent' })
  @ApiBody({ type: CreateMemberMembershipPaymentIntentDto })
  @ApiResponse({
      status: 200,
      description: 'Member membership and payment intent created',
  })
  @Post('payment-intent')
  @MinUserLevel(EUserLevels.MEMBER)
  async createMemberMembershipPaymentIntent(
      @Body() memberMembershipBillingPaymentIntentDto: CreateMemberMembershipPaymentIntentDto,
      @AuthUser() currentUser: User,
      @Timezone() timezone: string,
  ) {
      return this.memberMembershipBillingService.createMemberMembershipWithPaymentIntent(
          memberMembershipBillingPaymentIntentDto,
          currentUser,
          timezone,
      );
  }


  @ApiOperation({ summary: 'Get member membership billings for a member' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all member membership billings for the member',
    type: [MemberMembershipBillingDto],
  })
  @Get('member/:memberId')
  async getMemberMembershipBillings(
    @Param('memberId') memberId: string,
  ) {
    return this.memberMembershipBillingService.getMemberMembershipBillings(memberId);
  }
}

  