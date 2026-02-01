import { Injectable, Logger } from '@nestjs/common';
import { In } from 'typeorm';
import { User } from '@/common/base-user/entities/user.entity';
import { NotificationService } from '@/common/notification/notification.service';
import {
  ENotificationPriority,
  ENotificationType,
} from '@shared/enums/notification.enum';
import { EUserLevels } from '@shared/enums/user.enum';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class UserNotificationService {
  private readonly logger = new Logger(UserNotificationService.name);

  constructor(
    private readonly entityRouterService: EntityRouterService,
    private readonly notificationService: NotificationService,
  ) { }

  /**
   * Send notification to user when they are created
   */
  async notifyUserCreated(user: User, createdBy?: string): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'Welcome to the platform',
        message: `Welcome ${user.firstName}! Your account has been successfully created.`,
        type: ENotificationType.SUCCESS,
        priority: ENotificationPriority.NORMAL,
        entityId: user.id,
        entityType: 'user',
        metadata: {
          action: 'user_created',
          userId: user.id,
          createdBy,
        },
      });

      this.logger.log(
        `✅ Notification sent to user ${user.email} for account creation`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification to user ${user.email}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification to user when they are updated
   */
  async notifyUserUpdated(user: User, updatedBy?: string): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'Account Updated',
        message: `Your account information has been updated successfully.`,
        type: ENotificationType.INFO,
        priority: ENotificationPriority.NORMAL,
        entityId: user.id,
        entityType: 'user',
        metadata: {
          action: 'user_updated',
          userId: user.id,
          updatedBy,
        },
      });

      this.logger.log(
        `✅ Notification sent to user ${user.email} for account update`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification to user ${user.email}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification to all admins when a user is created
   */
  async notifyAdminsUserCreated(user: User, createdBy?: string): Promise<void> {
    try {
      // Find all admin users (PLATFORM_OWNER = 0, SUPER_ADMIN = 1, ADMIN = 2)
      const userRepo = this.entityRouterService.getRepository<User>(User);
      const adminUsers = await userRepo.find({
        where: {
          level: In([EUserLevels.SUPER_ADMIN, EUserLevels.ADMIN]),
          isActive: true,
        },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      if (adminUsers.length === 0) {
        this.logger.warn('No admin users found to notify');
        return;
      }

      // Send notification to each admin
      const notificationPromises = adminUsers.map((admin) =>
        this.notificationService.createNotification({
          title: 'New User Created',
          message: `A new user "${user.firstName} ${user.lastName}" (${user.email}) has been created.`,
          type: ENotificationType.INFO,
          priority: ENotificationPriority.NORMAL,
          entityId: admin.id,
          entityType: 'user',
          metadata: {
            action: 'user_created',
            targetUserId: user.id,
            targetUserEmail: user.email,
            createdBy,
          },
        }),
      );

      await Promise.all(notificationPromises);

      this.logger.log(
        `✅ Notifications sent to ${adminUsers.length} admin(s) for new user ${user.email}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send admin notifications for user ${user.email}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification to all admins when a user is updated
   */
  async notifyAdminsUserUpdated(user: User, updatedBy?: string): Promise<void> {
    try {
      // Find all admin users (PLATFORM_OWNER = 0, SUPER_ADMIN = 1, ADMIN = 2)
      const userRepo = this.entityRouterService.getRepository<User>(User);
      const adminUsers = await userRepo.find({
        where: {
          level: In([EUserLevels.SUPER_ADMIN, EUserLevels.ADMIN]),
          isActive: true,
        },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      if (adminUsers.length === 0) {
        this.logger.warn('No admin users found to notify');
        return;
      }

      // Send notification to each admin
      const notificationPromises = adminUsers.map((admin) =>
        this.notificationService.createNotification({
          title: 'User Updated',
          message: `User "${user.firstName} ${user.lastName}" (${user.email}) has been updated.`,
          type: ENotificationType.INFO,
          priority: ENotificationPriority.NORMAL,
          entityId: admin.id,
          entityType: 'user',
          metadata: {
            action: 'user_updated',
            targetUserId: user.id,
            targetUserEmail: user.email,
            updatedBy,
          },
        }),
      );

      await Promise.all(notificationPromises);

      this.logger.log(
        `✅ Notifications sent to ${adminUsers.length} admin(s) for updated user ${user.email}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send admin notifications for updated user ${user.email}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notifications to both user and admins when user is created
   */
  async handleUserCreated(user: User, createdBy?: string): Promise<void> {
    await Promise.all([
      this.notifyUserCreated(user, createdBy),
      this.notifyAdminsUserCreated(user, createdBy),
    ]);
  }

  /**
   * Send notifications to both user and admins when user is updated
   */
  async handleUserUpdated(user: User, updatedBy?: string): Promise<void> {
    await Promise.all([
      this.notifyUserUpdated(user, updatedBy),
      this.notifyAdminsUserUpdated(user, updatedBy),
    ]);
  }

  /**
   * Send notification to user when password is reset
   */
  async notifyUserPasswordReset(user: User, resetBy?: string): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'Password Reset',
        message: `Your password has been successfully reset. If you did not request this change, please contact support immediately.`,
        type: ENotificationType.WARNING,
        priority: ENotificationPriority.HIGH,
        entityId: user.id,
        entityType: 'user',
        metadata: {
          action: 'password_reset',
          userId: user.id,
          resetBy,
        },
      });

      this.logger.log(
        `✅ Notification sent to user ${user.email} for password reset`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send password reset notification to user ${user.email}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification to all admins when a user's password is reset
   */
  async notifyAdminsPasswordReset(user: User, resetBy?: string): Promise<void> {
    try {
      // Find all admin users (PLATFORM_OWNER = 0, SUPER_ADMIN = 1, ADMIN = 2)
      const userRepo = this.entityRouterService.getRepository<User>(User);
      const adminUsers = await userRepo.find({
        where: {
          level: In([EUserLevels.SUPER_ADMIN, EUserLevels.ADMIN]),
          isActive: true,
        },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      if (adminUsers.length === 0) {
        this.logger.warn('No admin users found to notify');
        return;
      }

      // Send notification to each admin
      const notificationPromises = adminUsers.map((admin) =>
        this.notificationService.createNotification({
          title: 'User Password Reset',
          message: `Password for user "${user.firstName} ${user.lastName}" (${user.email}) has been reset.`,
          type: ENotificationType.WARNING,
          priority: ENotificationPriority.NORMAL,
          entityId: admin.id,
          entityType: 'user',
          metadata: {
            action: 'password_reset',
            targetUserId: user.id,
            targetUserEmail: user.email,
            resetBy,
          },
        }),
      );

      await Promise.all(notificationPromises);

      this.logger.log(
        `✅ Notifications sent to ${adminUsers.length} admin(s) for password reset of user ${user.email}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send admin notifications for password reset of user ${user.email}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notifications to both user and admins when password is reset
   */
  async handlePasswordReset(user: User, resetBy?: string): Promise<void> {
    await Promise.all([
      this.notifyUserPasswordReset(user, resetBy),
      this.notifyAdminsPasswordReset(user, resetBy),
    ]);
  }

  /**
   * Send notification to all admins when a user is deleted
   * Note: Only admins are notified, not the deleted user
   */
  async notifyAdminsUserDeleted(user: User, deletedBy?: string): Promise<void> {
    try {
      // Find all admin users (PLATFORM_OWNER = 0, SUPER_ADMIN = 1, ADMIN = 2)
      const userRepo = this.entityRouterService.getRepository<User>(User);
      const adminUsers = await userRepo.find({
        where: {
          level: In([EUserLevels.SUPER_ADMIN, EUserLevels.ADMIN]),
          isActive: true,
        },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      if (adminUsers.length === 0) {
        this.logger.warn('No admin users found to notify');
        return;
      }

      // Send notification to each admin
      const notificationPromises = adminUsers.map((admin) =>
        this.notificationService.createNotification({
          title: 'User Deleted',
          message: `User "${user.firstName} ${user.lastName}" (${user.email}) has been deleted from the system.`,
          type: ENotificationType.WARNING,
          priority: ENotificationPriority.HIGH,
          entityId: admin.id,
          entityType: 'user',
          metadata: {
            action: 'user_deleted',
            deletedUserId: user.id,
            deletedUserEmail: user.email,
            deletedUserFirstName: user.firstName,
            deletedUserLastName: user.lastName,
            deletedBy,
          },
        }),
      );

      await Promise.all(notificationPromises);

      this.logger.log(
        `✅ Notifications sent to ${adminUsers.length} admin(s) for deleted user ${user.email}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send admin notifications for deleted user ${user.email}: ${errorMessage}`,
      );
    }
  }

  /**
   * Handle user deletion - only notify admins
   */
  async handleUserDeleted(user: User, deletedBy?: string): Promise<void> {
    await this.notifyAdminsUserDeleted(user, deletedBy);
  }
}
