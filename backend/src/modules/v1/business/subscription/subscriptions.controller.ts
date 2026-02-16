import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { SelectQueryBuilder, Brackets } from 'typeorm';

import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionDto,
  SubscriptionPaginatedDto,
  SubscriptionListDto,
} from '@shared/dtos';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { SkipBusinessCheck } from '@/decorators/skip-business-check.decorator';

@ApiTags('Subscriptions')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) { }

  @ApiOperation({
    summary: 'Get all subscriptions with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of subscriptions',
    type: SubscriptionPaginatedDto,
  })
  @Get()
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  @SkipBusinessCheck()
  findAll(@Query() query: SubscriptionListDto) {
    return this.subscriptionsService.get(query, SubscriptionListDto);
  }

  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns subscription',
    type: SubscriptionDto,
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.getSingle(id);
  }

  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiBody({ type: CreateSubscriptionDto, description: 'Subscription details' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  @Post()
  create(
    @Body() createDto: CreateSubscriptionDto,
    @AuthUser() currentUser: User,
  ) {
    return this.subscriptionsService.createSubscription(createDto);
  }

  @ApiOperation({ summary: 'Update a subscription plan by ID' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiBody({
    type: UpdateSubscriptionDto,
    description: 'Updated subscription details',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateSubscriptionDto) {
    return this.subscriptionsService.updateSubscription(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete a subscription plan by ID' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Subscription deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.subscriptionsService.delete(id);
  }
}
