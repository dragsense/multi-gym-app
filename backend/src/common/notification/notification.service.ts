import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, SelectQueryBuilder } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { CrudService } from '@/common/crud/crud.service';
import { NotificationSenderService } from './notification-sender.service';
import { IPaginatedResponse } from '@shared/interfaces';
import { ServerGateway } from '@/common/gateways/server.gateway';

export interface NotificationConfig {
  enabled: boolean;
  logEndpoints: string[];
  logMethods: string[];
  logNotificationTypes: string[];
}

@Injectable()
export class NotificationService extends CrudService<Notification> {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
    private readonly notificationSenderService: NotificationSenderService,
    private readonly serverGateway: ServerGateway,
    moduleRef: ModuleRef,
  ) {
    super(notificationRepository, moduleRef);
  }

  async findOne(
    where: FindOptionsWhere<Notification>,
    options?: {
      select?: (keyof Notification)[];
      relations?: string[];
    },
  ): Promise<Notification> {
    const { select, relations = ['user'] } = options || {};
    const repository = this.getRepository();

    const notification = await repository.findOne({
      where,
      select,
      relations,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification | null> {
    // Create the notification in database
    const notification = await this.create(createNotificationDto);

    // Send notification through enabled channels (in-app, email, SMS, push)
    if (notification && notification.entityId) {
      try {
        await this.notificationSenderService.sendNotification(notification);
      } catch (error) {
        // Log error but don't fail the notification creation
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          `Failed to send notification ${notification.id}: ${errorMessage}`,
        );
      }
    }

    return notification;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.update(id, { isRead: true });

    return notification;
  }

  /**
   * Mark a notification as read with tenant support
   * Ensures we update in the correct tenant database
   */
  async markAsReadWithTenant(id: string, tenantId?: string): Promise<Notification> {
    const repository = tenantId ? this.getRepository(tenantId) : this.getRepository();
    
    this.logger.log(`Marking notification ${id} as read${tenantId ? ` (tenant: ${tenantId})` : ' (default tenant)'}`);
    
    const notification = await repository.findOne({ where: { id } });
    if (!notification) {
      this.logger.warn(`Notification ${id} not found${tenantId ? ` in tenant ${tenantId}` : ' in default tenant'}`);
      throw new NotFoundException(`Notification not found`);
    }

    notification.isRead = true;
    const updatedNotification = await repository.save(notification);

    // Emit WebSocket event to update frontend in real-time
    if (notification.entityId) {
      try {
        const userRoom = `user_${notification.entityId}`;
        this.serverGateway.emitToClient(userRoom, 'notificationRead', id);
      } catch (error) {
        // Log but don't fail if WebSocket emit fails
        this.logger.warn(`Failed to emit notificationRead event: ${error}`);
      }
    }

    return updatedNotification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(entityId: string) {
    const result = await this.update(
      { entityId, isRead: false },
      { isRead: true },
    );

    return result;
  }

  /**
   * Mark all notifications as read for a user with tenant support
   * Ensures we update in the correct tenant database
   */
  async markAllAsReadWithTenant(entityId: string, tenantId?: string) {
    const repository = tenantId ? this.getRepository(tenantId) : this.getRepository();
    
    // Get all notifications that will be updated
    const notifications = await repository.find({
      where: { entityId, isRead: false },
      select: ['id'],
    });

    const result = await repository.update(
      { entityId, isRead: false },
      { isRead: true },
    );

    // Emit WebSocket events for each notification to update frontend in real-time
    if (notifications.length > 0) {
      try {
        const userRoom = `user_${entityId}`;
        // Emit individual notificationRead events for each notification
        notifications.forEach((notification) => {
          this.serverGateway.emitToClient(userRoom, 'notificationRead', notification.id);
        });
      } catch (error) {
        // Log but don't fail if WebSocket emit fails
        this.logger.warn(`Failed to emit notificationRead events: ${error}`);
      }
    }

    return {
      count: result.affected || 0,
      message: `${result.affected || 0} notification(s) marked as read`,
    };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(entityId: string): Promise<number> {
    const repository = this.getRepository();
    return await repository.count({
      where: { entityId, isRead: false },
    });
  }

  /**
   * Get notifications with explicit tenant ID support
   * This ensures admin users query the correct tenant database
   * 
   * When tenantId is provided, temporarily overrides getRepository() to use
   * the tenant-specific database, then uses the standard CrudService.get() method.
   * This follows the existing architecture pattern while ensuring correct tenant routing.
   */
  async getWithTenant<TQueryDto>(
    queryDto: TQueryDto,
    dtoClass: any,
    tenantId?: string,
    callbacks?: {
      beforeQuery?: (query: SelectQueryBuilder<Notification>) => any | Promise<any>;
    },
  ): Promise<IPaginatedResponse<Notification>> {
    if (tenantId) {
      // Store original getRepository method
      const originalGetRepository = this.getRepository.bind(this);
      
      // Temporarily override to use tenant-specific repository
      const originalMethod = this.getRepository;
      (this as any).getRepository = () => originalGetRepository(tenantId);

      try {
        // Use parent get() method which will now use the tenant-specific repository
        return await this.get(queryDto, dtoClass, callbacks);
      } finally {
        // Restore original method
        (this as any).getRepository = originalMethod;
      }
    }

    // If no tenantId, use parent get() method with default repository routing
    return await this.get(queryDto, dtoClass, callbacks);
  }
}
