import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StripeConnectService } from './stripe-connect.service';
import { AuthUser } from '@/decorators/user.decorator';
import { CreateStripeConnectDto } from '@shared/dtos';
import {
  StripeConnectStatusDto,
  StripeConnectCreateResponseDto,
} from '@shared/dtos';
import { User } from '@/common/base-user/entities/user.entity';

@ApiTags('Settings - Stripe Connect')
@ApiBearerAuth()
@Controller('stripe-connect')
export class StripeConnectController {
  constructor(private readonly stripeConnectService: StripeConnectService) {}

  @Post()
  @ApiOperation({ summary: 'Create Stripe Connect account' })
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
  @ApiOperation({ summary: 'Get Stripe Connect account status' })
  @ApiResponse({
    status: 200,
    description: 'Account status retrieved successfully',
    type: StripeConnectStatusDto,
  })
  async getStatus(@AuthUser() authUser: User): Promise<StripeConnectStatusDto> {
    return this.stripeConnectService.findByUser(authUser);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete Stripe Connect account' })
  @ApiResponse({
    status: 200,
    description: 'Stripe Connect account deleted successfully',
  })
  @HttpCode(204)
  @ApiResponse({ status: 404, description: 'Account not found' })
  async delete(@AuthUser() user: User) {
    return this.stripeConnectService.delete(user);
  }
}
