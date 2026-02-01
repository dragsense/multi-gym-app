import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { SessionBillingService } from '../services/session-billing.service';
import { SessionBilling } from '../entities/session-billing.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { SessionPaymentIntentDto } from '@shared/dtos/session-dtos';
import { Timezone } from '@/decorators/timezone.decorator';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Session Billing')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('session-billings')
export class SessionBillingController {
  constructor(private readonly sessionBillingService: SessionBillingService) {}

  @ApiOperation({ summary: 'Create payment intent for a session' })
  @ApiBody({ type: SessionPaymentIntentDto })
  @ApiResponse({
    status: 200,
    description: 'Payment intent created',
  })
  @Post('payment-intent')
  @MinUserLevel(EUserLevels.MEMBER)
  async createSessionPaymentIntent(
    @Body() sessionPaymentIntentDto: SessionPaymentIntentDto,
    @AuthUser() currentUser: User,
    @Timezone() timezone: string,
  ) {
    return this.sessionBillingService.createSessionPaymentIntent(
      sessionPaymentIntentDto,
      currentUser,
      timezone,
    );
  }

  @ApiOperation({ summary: 'Get session billings for a member' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all session billings for the member',
    type: [SessionBilling],
  })
  @Get('member/:memberId')
  async getMemberSessionBillings(
    @Param('memberId') memberId: string,
  ): Promise<SessionBilling[]> {
    return this.sessionBillingService.getMemberSessionBillings(memberId);
  }

  @ApiOperation({
    summary: 'Check if a member has paid for a specific session',
  })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns payment status for the member and session',
  })
  @Get('session/:sessionId/member/:memberId/payment-status')
  async checkMemberSessionPayment(
    @Param('sessionId') sessionId: string,
    @Param('memberId') memberId: string,
  ): Promise<{ hasPaid: boolean; billing?: SessionBilling }> {
    return this.sessionBillingService.checkMemberSessionPayment(
      sessionId,
      memberId,
    );
  }
}
