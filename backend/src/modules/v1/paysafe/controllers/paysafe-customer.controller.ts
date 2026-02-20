import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
import { RequestContext } from '@/common/context/request-context';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { UsersService } from '@/modules/v1/users/users.service';
import { PaysafeCustomerService } from '../services/paysafe-customer.service';

@ApiBearerAuth('access-token')
@ApiTags('Paysafe Customer')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('paysafe-customer')
export class PaysafeCustomerController {
  constructor(
    private readonly paysafeCustomerService: PaysafeCustomerService,
    private readonly usersService: UsersService,
  ) {}

  @Get('cards')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get customer saved cards (payment handles)' })
  @MinUserLevel(EUserLevels.MEMBER)
  async getCustomerCards(@AuthUser() user: User) {
    try {
      const tenantId = RequestContext.get<string>('tenantId');
      return await this.paysafeCustomerService.getCustomerCards(user, tenantId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve customer cards: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Post('cards')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a new card to customer profile' })
  @MinUserLevel(EUserLevels.MEMBER)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethodId: { type: 'string', description: 'Paysafe single-use paymentHandleToken' },
        setAsDefault: { type: 'boolean', default: false },
      },
      required: ['paymentMethodId'],
    },
  })
  async addPaymentMethod(
    @AuthUser() user: User,
    @Body() body: { paymentMethodId: string; setAsDefault?: boolean },
  ): Promise<{ message: string }> {
    try {
      const tenantId = RequestContext.get<string>('tenantId');
      await this.paysafeCustomerService.addCardFromSingleUseToken(
        user,
        body.paymentMethodId,
        body.setAsDefault || false,
        tenantId,
      );
      return { message: 'Payment method added successfully' };
    } catch (error) {
      throw new BadRequestException(
        `Failed to add payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Get('cards/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get default saved payment method' })
  @MinUserLevel(EUserLevels.MEMBER)
  async getDefaultPaymentMethod(@AuthUser() user: User) {
    try {
      const tenantId = RequestContext.get<string>('tenantId');
      return await this.paysafeCustomerService.getDefaultPaymentMethod(user, tenantId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve default payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Get(':userId/cards/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get default payment method for a user (admin)' })
  @MinUserLevel(EUserLevels.ADMIN)
  async getUserDefaultPaymentMethod(@Param('userId') userId: string) {
    try {
      const user = await this.usersService.getUser(userId);
      if (!user) throw new NotFoundException('User not found');
      const tenantId = RequestContext.get<string>('tenantId');
      return await this.paysafeCustomerService.getUserDefaultPaymentMethod(user, tenantId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve default payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Post('cards/:paymentMethodId/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set default saved card' })
  @ApiParam({ name: 'paymentMethodId', description: 'Paysafe paymentHandleToken to set default' })
  @MinUserLevel(EUserLevels.MEMBER)
  async setDefaultPaymentMethod(
    @AuthUser() user: User,
    @Param('paymentMethodId') paymentMethodId: string,
  ): Promise<{ message: string }> {
    try {
      const tenantId = RequestContext.get<string>('tenantId');
      await this.paysafeCustomerService.setDefaultCard(user, paymentMethodId, tenantId);
      return { message: 'Default payment method set successfully' };
    } catch (error) {
      throw new BadRequestException(
        `Failed to set default payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  @Delete('cards/:paymentMethodId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a saved card' })
  @ApiParam({ name: 'paymentMethodId', description: 'Paysafe paymentHandleToken to delete' })
  @MinUserLevel(EUserLevels.MEMBER)
  async deletePaymentMethod(
    @AuthUser() user: User,
    @Param('paymentMethodId') paymentMethodId: string,
  ): Promise<{ message: string }> {
    try {
      const tenantId = RequestContext.get<string>('tenantId');
      return await this.paysafeCustomerService.deleteCard(user, paymentMethodId, tenantId);
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete payment method: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

