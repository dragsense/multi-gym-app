import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthUser } from '@/decorators/user.decorator';
import { MinUserLevel } from '@/decorators/level.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { PaymentCardsResponseDto } from '@shared/dtos/payment-card-dtos';
import type { IPaymentCardsResponse } from '@shared/interfaces';
import { PaymentAdapterCardsService } from '../services/payment-adapter-cards.service';

@ApiBearerAuth('access-token')
@ApiTags('Payment Adapter - Cards')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('payment-adapter')
export class PaymentAdapterCardsController {
  constructor(private readonly cardsService: PaymentAdapterCardsService) {}

  @Get('cards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get customer payment methods (cards) - Stripe or Paysafe by tenant' })
  @MinUserLevel(EUserLevels.MEMBER)
  @ApiResponse({ status: 200, description: 'Customer cards retrieved', type: PaymentCardsResponseDto })
  async getCustomerCards(@AuthUser() user: User): Promise<IPaymentCardsResponse> {
    try {
      return await this.cardsService.getCustomerCards(user);
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve customer cards: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Post('cards')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add payment method - Stripe or Paysafe by tenant' })
  @MinUserLevel(EUserLevels.MEMBER)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethodId: { type: 'string' },
        setAsDefault: { type: 'boolean', default: false },
      },
      required: ['paymentMethodId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Payment method added' })
  async addPaymentMethod(
    @AuthUser() user: User,
    @Body() body: { paymentMethodId: string; setAsDefault?: boolean },
  ): Promise<{ message: string }> {
    try {
      return await this.cardsService.addPaymentMethod(
        user,
        body.paymentMethodId,
        body.setAsDefault ?? false,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to add payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Get('cards/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get default payment method' })
  @MinUserLevel(EUserLevels.MEMBER)
  @ApiResponse({ status: 200, description: 'Default payment method' })
  async getDefaultPaymentMethod(@AuthUser() user: User) {
    try {
      return await this.cardsService.getDefaultPaymentMethod(user);
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve default payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Get(':userId/cards/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get default payment method for user (admin)' })
  @MinUserLevel(EUserLevels.ADMIN)
  @ApiParam({ name: 'userId' })
  @ApiResponse({ status: 200, description: 'Default payment method' })
  async getUserDefaultPaymentMethod(@Param('userId') userId: string) {
    try {
      return await this.cardsService.getUserDefaultPaymentMethod(userId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve default payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Post('cards/:paymentMethodId/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set card as default' })
  @MinUserLevel(EUserLevels.MEMBER)
  @ApiParam({ name: 'paymentMethodId' })
  @ApiResponse({ status: 200, description: 'Default set' })
  async setDefaultPaymentMethod(
    @AuthUser() user: User,
    @Param('paymentMethodId') paymentMethodId: string,
  ): Promise<{ message: string }> {
    try {
      return await this.cardsService.setDefaultPaymentMethod(user, paymentMethodId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to set default payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Delete('cards/:paymentMethodId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete payment method' })
  @MinUserLevel(EUserLevels.MEMBER)
  @ApiParam({ name: 'paymentMethodId' })
  @ApiResponse({ status: 200, description: 'Payment method deleted' })
  async deletePaymentMethod(
    @AuthUser() user: User,
    @Param('paymentMethodId') paymentMethodId: string,
  ): Promise<{ message: string }> {
    try {
      return await this.cardsService.deletePaymentMethod(user, paymentMethodId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
