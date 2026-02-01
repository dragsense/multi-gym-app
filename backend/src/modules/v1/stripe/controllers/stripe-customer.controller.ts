import {
  Controller,
  Get,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { StripeCustomerService } from '../services';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import Stripe from 'stripe';
import { UsersService } from '../../users/users.service';

@ApiBearerAuth('access-token')
@ApiTags('Stripe Customer')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('stripe-customer')
export class StripeCustomerController {
  constructor(private readonly stripeCustomerService: StripeCustomerService, private readonly usersService: UsersService) { }

  @Get('info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Stripe customer information' })
  @ApiResponse({
    status: 200,
    description: 'Customer information retrieved successfully',
  })
  @ApiResponse({ status: 400, description: 'Failed to retrieve customer info' })
  async getCustomerInfo(@AuthUser() user: User): Promise<Stripe.Customer> {
    try {
      return await this.stripeCustomerService.getCustomerInfo(user);
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve customer information: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  @Get('cards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get customer payment methods (cards)' })
  @ApiResponse({
    status: 200,
    description: 'Customer cards retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to retrieve customer cards',
  })
  @MinUserLevel(EUserLevels.MEMBER)
  async getCustomerCards(
    @AuthUser() user: User,
  ) {
    try {
      return await this.stripeCustomerService.getCustomerCards(user);
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve customer cards: ${error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  @Post('cards')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new payment method (card)' })
  @MinUserLevel(EUserLevels.MEMBER)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethodId: { type: 'string', description: 'Stripe payment method ID' },
        setAsDefault: { type: 'boolean', description: 'Set as default payment method', default: false },
      },
      required: ['paymentMethodId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Payment method added successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to add payment method',
  })
  async addPaymentMethod(
    @AuthUser() user: User,
    @Body() body: { paymentMethodId: string; setAsDefault?: boolean },
  ): Promise<{ message: string }> {
    try {
      await this.stripeCustomerService.addPaymentMethod(user, body.paymentMethodId, body.setAsDefault || false);
      return { message: 'Payment method added successfully' };
    } catch (error) {
      throw new BadRequestException(
        `Failed to add payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Get('cards/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get default payment method' })
  @ApiResponse({
    status: 200,
    description: 'Default payment method ID retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to retrieve default payment method',
  })
  async getDefaultPaymentMethod(
    @AuthUser() user: User,
  ) {
    try {
      const defaultPaymentMethod= await this.stripeCustomerService.getDefaultPaymentMethod(user);
      return defaultPaymentMethod;
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve default payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  
  @Get(':userId/cards/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get default payment method' })
  @ApiResponse({
    status: 200,
    description: 'Default payment method ID retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to retrieve default payment method',
  })
  @MinUserLevel(EUserLevels.ADMIN)
  async getUserDefaultPaymentMethod(
    @Param('userId') userId: string,
  ) {
    try {
      const user = await this.usersService.getUser(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const defaultPaymentMethod= await this.stripeCustomerService.getDefaultPaymentMethod(user);
      return defaultPaymentMethod;
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve default payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Post('cards/:paymentMethodId/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a card as default payment method' })
  @ApiParam({ name: 'paymentMethodId', description: 'Payment method ID to set as default' })
  @ApiResponse({
    status: 200,
    description: 'Default payment method set successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to set default payment method',
  })
  async setDefaultPaymentMethod(
    @AuthUser() user: User,
    @Param('paymentMethodId') paymentMethodId: string,
  ): Promise<{ message: string }> {
    try {
      await this.stripeCustomerService.setDefaultPaymentMethod(user, paymentMethodId);
      return { message: 'Default payment method set successfully' };
    } catch (error) {
      throw new BadRequestException(
        `Failed to set default payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Delete('cards/:paymentMethodId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a payment method (card)' })
  @ApiParam({ name: 'paymentMethodId', description: 'Payment method ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Payment method deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to delete payment method',
  })
  async deletePaymentMethod(
    @AuthUser() user: User,
    @Param('paymentMethodId') paymentMethodId: string,
  ): Promise<{ message: string }> {
    try {
      return await this.stripeCustomerService.deletePaymentMethod(user, paymentMethodId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
