import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { PushNotificationService } from './services/push-notification.service';
import {
  NotificationListDto,
  NotificationDto,
  NotificationPaginatedDto,
  CreatePushSubscriptionDto,
  PushSubscriptionResponseDto,
  PushSubscriptionsListDto,
  UnsubscribePushResponseDto,
} from '@shared/dtos/notification-dtos';
import { SelectQueryBuilder } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { ExecutionContext } from '@nestjs/common';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly pushNotificationService: PushNotificationService,
    private readonly entityRouterService: EntityRouterService,
  ) { }

  /**
   * Extract tenant ID from request using EntityRouterService
   * This follows the same pattern used throughout the codebase
   */
  private extractTenantId(req: any): string | undefined {
    // Create a mock ExecutionContext to use EntityRouterService's extractTenantContext
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as ExecutionContext;

    const tenantContext = this.entityRouterService.extractTenantContext(mockContext);
    return tenantContext?.tenantId;
  }

  @Get()
  @ApiOperation({
    summary: 'Get all notifications with pagination and filtering',
  })
  @ApiQuery({ type: NotificationListDto })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of notifications',
    type: NotificationPaginatedDto,
  })
  async findAll(@Query() queryDto: NotificationListDto, @Request() req: any) {
    const entityId = req.user?.id as string;
    if (!entityId) {
      return {
        data: [],
        total: 0,
        page: queryDto.page || 1,
        limit: queryDto.limit || 10,
        lastPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }

    // Extract tenant ID from request - critical for admin users on subdomain
    // This ensures we query the correct tenant database where notifications are stored
    const tenantId = this.extractTenantId(req);

    // Use the custom method that accepts tenantId directly to ensure correct database routing
    return await this.notificationService.getWithTenant(
      queryDto,
      NotificationListDto,
      tenantId,
      {
        beforeQuery: (query: SelectQueryBuilder<Notification>) => {
          query
            .andWhere('entity.entityId = :entityId', { entityId })
            .orderBy('entity.createdAt', 'DESC'); // Newest notifications come first (DESC order)
        },
      },
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ type: NotificationListDto })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of user notifications',
    type: NotificationPaginatedDto,
  })
  async findByUser(@Param('userId') userId: string) {
    return await this.notificationService.getSingle({
      entityId: userId,
      entityType: 'user',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findOne(@Param('id') id: string) {
    return await this.notificationService.getSingle({ id });
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    type: NotificationDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    // Extract tenant ID to ensure we update in the correct tenant database
    const tenantId = this.extractTenantId(req);
    return await this.notificationService.markAsReadWithTenant(id, tenantId);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'string',
          description: 'Number of notifications marked as read',
        },
      },
    },
  })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.id;
    // Extract tenant ID to ensure we update in the correct tenant database
    const tenantId = this.extractTenantId(req);
    return await this.notificationService.markAllAsReadWithTenant(userId, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async delete(@Param('id') id: string) {
    await this.notificationService.delete(id);
    return { message: 'Notification deleted successfully' };
  }

  @Delete('user/:userId')
  @ApiOperation({ summary: 'Delete all notifications for current user' })
  @ApiResponse({
    status: 200,
    description: 'All notifications deleted successfully',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'string',
          description: 'Number of notifications deleted',
        },
      },
    },
  })
  async deleteAll(@Request() req: any) {
    const userId = req.user?.id;
    return await this.notificationService.delete({
      entityId: userId,
    });
  }

  @Post('push/subscribe')
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  @ApiResponse({
    status: 201,
    description: 'Push subscription created successfully',
    type: PushSubscriptionResponseDto,
  })
  async subscribeToPush(
    @Body() subscriptionDto: CreatePushSubscriptionDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    const subscription = await this.pushNotificationService.saveSubscription(
      userId,
      {
        endpoint: subscriptionDto.endpoint,
        keys: subscriptionDto.keys,
      },
      subscriptionDto.userAgent || req.headers?.['user-agent'],
      subscriptionDto.deviceId,
    );

    return {
      message: 'Push subscription created successfully',
      subscription: {
        id: subscription.id,
        userId: subscription.userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: subscription.userAgent,
        deviceId: subscription.deviceId,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    };
  }

  @Delete('push/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  @ApiResponse({
    status: 200,
    description: 'Push subscription removed successfully',
    type: UnsubscribePushResponseDto,
  })
  async unsubscribeFromPush(
    @Request() req: any,
    @Query('endpoint') endpoint: string,
  ) {
    const userId = req.user?.id;
    const removed = await this.pushNotificationService.removeSubscription(
      userId,
      endpoint,
    );

    return {
      message: removed
        ? 'Push subscription removed successfully'
        : 'Push subscription not found',
      removed,
    };
  }

  @Get('push/subscriptions')
  @ApiOperation({ summary: 'Get all push subscriptions for current user' })
  @ApiResponse({
    status: 200,
    description: 'Push subscriptions retrieved successfully',
    type: PushSubscriptionsListDto,
  })
  async getPushSubscriptions(@Request() req: any) {
    const userId = req.user?.id;
    const subscriptions =
      await this.pushNotificationService.getUserSubscriptions(userId);

    return {
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        userId: sub.userId,
        endpoint: sub.endpoint,
        keys: sub.keys,
        userAgent: sub.userAgent,
        deviceId: sub.deviceId,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      })),
      count: subscriptions.length,
    };
  }
}
