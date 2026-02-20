import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StripeConnectService } from '../services/stripe-connect.service'; 
import { AuthUser } from '@/decorators/user.decorator';
import { CreateStripeConnectDto } from '@shared/dtos';
import {
  StripeConnectStatusDto,
  StripeConnectCreateResponseDto,
} from '@shared/dtos';
import { User } from '@/common/base-user/entities/user.entity';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';
import { RequestContext } from '@/common/context/request-context';

@ApiTags('Settings - Stripe Connect')
@ApiBearerAuth()
@Controller('stripe-connect')
@MinUserLevel(EUserLevels.SUPER_ADMIN)
export class StripeConnectController {
  constructor(private readonly stripeConnectService: StripeConnectService) {}

  @Get('account-id')
  @MinUserLevel(EUserLevels.MEMBER)
  @ApiOperation({ summary: 'Get connected Stripe account ID for the current tenant' })
  @ApiResponse({
    status: 200,
    description: 'Connected account ID retrieved',
  })
  async getConnectedAccountId(): Promise<{ stripeAccountId: string | null }> {
    const tenantId = RequestContext.get<string>('tenantId');

    if(!tenantId) {
      return { stripeAccountId: null };
    }

    const connectAccount = await this.stripeConnectService.findByTenantId(tenantId);
    return { stripeAccountId: connectAccount.stripeAccountId };
  }

  @Post()
  @ApiOperation({ summary: 'Create Stripe Connect account for business' })
  @ApiResponse({
    status: 201,
    description: 'Stripe Connect account created successfully',
    type: StripeConnectCreateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Account already exists or invalid data',
  })
  async create(
    @AuthUser() user: User,
    @Body() createDto: CreateStripeConnectDto,
  ): Promise<StripeConnectCreateResponseDto> {
    return this.stripeConnectService.connectStripeAccount(user, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get Stripe Connect account status for business' })
  @ApiResponse({
    status: 200,
    description: 'Account status retrieved successfully',
    type: StripeConnectStatusDto,
  })
  async getStatus(@AuthUser() authUser: User): Promise<StripeConnectStatusDto> {
    return this.stripeConnectService.findByUser(authUser);
  }

  @Post('onboarding-link')
  @ApiOperation({ summary: 'Generate new Stripe onboarding link' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding link generated successfully',
    type: StripeConnectCreateResponseDto,
  })
  async getOnboardingLink(
    @AuthUser() user: User,
  ): Promise<StripeConnectCreateResponseDto> {
    return this.stripeConnectService.getOnboardingLink(user);
  }

  @Delete()
  @ApiOperation({ summary: 'Disconnect Stripe Connect account from business' })
  @ApiResponse({
    status: 200,
    description: 'Stripe Connect account disconnected successfully',
  })
  @HttpCode(200)
  @ApiResponse({ status: 404, description: 'Account not found' })
  async disconnect(@AuthUser() user: User) {
    return this.stripeConnectService.disconnectStripeAccount(user);
  }
}
