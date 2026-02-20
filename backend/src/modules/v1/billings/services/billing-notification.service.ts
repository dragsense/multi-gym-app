import { Injectable, Logger } from '@nestjs/common';
import { In, Not } from 'typeorm';
import { User } from '@/common/base-user/entities/user.entity';
import { NotificationService } from '@/common/notification/notification.service';
import {
  ENotificationPriority,
  ENotificationType,
} from '@shared/enums/notification.enum';
import { EUserLevels } from '@shared/enums/user.enum';
import { Billing } from '../entities/billing.entity';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class BillingNotificationService {
  private readonly logger = new Logger(BillingNotificationService.name);

  constructor(
    private readonly entityRouterService: EntityRouterService,
    private readonly notificationService: NotificationService,
  ) { }

  /**
   * Send notification to recipient when billing is created
   */
  async notifyBillingCreated(
    billing: Billing,
    createdBy?: string,
  ): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'New Billing Created',
        message: `A new billing "${billing.title}" for $${billing.amount} has been created. Due date: ${new Date(billing.dueDate).toLocaleDateString()}`,
        type: ENotificationType.INFO,
        priority: ENotificationPriority.NORMAL,
        entityId: billing.recipientUser.id,
        entityType: 'billing',
        emailSubject: `New Billing: ${billing.title}`,
        metadata: {
          action: 'billing_created',
          billingId: billing.id,
          amount: billing.amount,
          dueDate: billing.dueDate,
          createdBy,
        },
      });

      this.logger.log(
        `✅ Notification sent for billing ${billing.id} to user ${billing.recipientUser.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for billing ${billing.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification to recipient when billing is updated
   */
  async notifyBillingUpdated(
    billing: Billing,
    updatedBy?: string,
  ): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'Billing Updated',
        message: `The billing "${billing.title}" has been updated.`,
        type: ENotificationType.INFO,
        priority: ENotificationPriority.NORMAL,
        entityId: billing.recipientUser.id,
        entityType: 'billing',
        emailSubject: `Billing Updated: ${billing.title}`,
        metadata: {
          action: 'billing_updated',
          billingId: billing.id,
          updatedBy,
        },
      });

      this.logger.log(`✅ Notification sent for updated billing ${billing.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for updated billing ${billing.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when billing is paid
   */
  async notifyBillingPaid(billing: Billing): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'Billing Paid',
        message: `Your billing "${billing.title}" has been paid successfully. Thank you!`,
        type: ENotificationType.SUCCESS,
        priority: ENotificationPriority.NORMAL,
        entityId: billing.recipientUser.id,
        entityType: 'billing',
        emailSubject: `Payment Confirmed: ${billing.title}`,
        metadata: {
          action: 'billing_paid',
          billingId: billing.id,
          amount: billing.amount,
        },
      });

      this.logger.log(`✅ Notification sent for paid billing ${billing.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for paid billing ${billing.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification to Platform Owner when billing is created
   * This notification includes "for [user]" text
   */
  async notifyAdminsBillingCreated(
    billing: Billing,
    createdBy?: string,
  ): Promise<void> {
    try {
      // Find platform owner only
      const userRepo = this.entityRouterService.getRepository<User>(User);
      const adminUsers = await userRepo.find({
        where: {
          level: EUserLevels.PLATFORM_OWNER,
          isActive: true,
        },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      if (adminUsers.length === 0) {
        return;
      }

      const notificationPromises = adminUsers.map((admin) =>
        this.notificationService.createNotification({
          title: 'New Billing Created',
          message: `A new billing "${billing.title}" for $${billing.amount} has been created for ${billing.recipientUser.firstName} ${billing.recipientUser.lastName}.`,
          type: ENotificationType.INFO,
          priority: ENotificationPriority.NORMAL,
          entityId: admin.id,
          entityType: 'billing',
          metadata: {
            action: 'billing_created',
            billingId: billing.id,
            recipientUserId: billing.recipientUser.id,
            createdBy,
          },
        }),
      );

      await Promise.all(notificationPromises);

      this.logger.log(
        `✅ Notifications sent to ${adminUsers.length} platform owner(s) for billing ${billing.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send platform owner notifications for billing ${billing.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification to Super Admins and Admins when billing is created
   * This notification includes the due date
   */
  async notifySuperAdminsBillingCreated(
    billing: Billing,
    createdBy?: string,
  ): Promise<void> {
    try {
      // Find Super Admins and Admins, excluding the recipient to avoid duplicate notifications
      const userRepo = this.entityRouterService.getRepository<User>(User);
      const adminUsers = await userRepo.find({
        where: {
          id: Not(billing.recipientUser.id),
          level: In([EUserLevels.SUPER_ADMIN, EUserLevels.ADMIN]),
          isActive: true,
        },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      if (adminUsers.length === 0) {
        return;
      }

      const notificationPromises = adminUsers.map((admin) =>
        this.notificationService.createNotification({
          title: 'New Billing Created',
          message: `A new billing "${billing.title}" for $${billing.amount} has been created. Due date: ${new Date(billing.dueDate).toLocaleDateString()}`,
          type: ENotificationType.INFO,
          priority: ENotificationPriority.NORMAL,
          entityId: admin.id,
          entityType: 'billing',
          metadata: {
            action: 'billing_created',
            billingId: billing.id,
            amount: billing.amount,
            dueDate: billing.dueDate,
            createdBy,
          },
        }),
      );

      await Promise.all(notificationPromises);

      this.logger.log(
        `✅ Notifications sent to ${adminUsers.length} super admin(s)/admin(s) for billing ${billing.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send super admin notifications for billing ${billing.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification to recipient when billing is deleted
   */
  async notifyBillingDeleted(billing: Billing): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'Billing Deleted',
        message: `The billing "${billing.title}" has been deleted.`,
        type: ENotificationType.WARNING,
        priority: ENotificationPriority.NORMAL,
        entityId: billing.recipientUser.id,
        entityType: 'billing',
        emailSubject: `Billing Deleted: ${billing.title}`,
        metadata: {
          action: 'billing_deleted',
          billingId: billing.id,
          amount: billing.amount,
        },
      });

      this.logger.log(`✅ Notification sent for deleted billing ${billing.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for deleted billing ${billing.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when billing payment failed
   */
  async notifyBillingFailed(billing: Billing, reason?: string): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'Payment Failed',
        message: `Payment for billing "${billing.title}" has failed.${reason ? ` Reason: ${reason}` : ''} Please try again or contact support.`,
        type: ENotificationType.ERROR,
        priority: ENotificationPriority.HIGH,
        entityId: billing.recipientUser.id,
        entityType: 'billing',
        emailSubject: `Payment Failed: ${billing.title}`,
        metadata: {
          action: 'billing_failed',
          billingId: billing.id,
          amount: billing.amount,
          reason,
        },
      });

      this.logger.log(`✅ Notification sent for failed billing ${billing.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for failed billing ${billing.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when billing is pending payment
   */
  async notifyBillingPending(billing: Billing): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'Payment Pending',
        message: `Your billing "${billing.title}" for $${billing.amount} is pending payment. Due date: ${new Date(billing.dueDate).toLocaleDateString()}`,
        type: ENotificationType.WARNING,
        priority: ENotificationPriority.NORMAL,
        entityId: billing.recipientUser.id,
        entityType: 'billing',
        emailSubject: `Payment Pending: ${billing.title}`,
        metadata: {
          action: 'billing_pending',
          billingId: billing.id,
          amount: billing.amount,
          dueDate: billing.dueDate,
        },
      });

      this.logger.log(`✅ Notification sent for pending billing ${billing.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for pending billing ${billing.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send email notification to admins and platform owners when billing is created
   * PLACEHOLDER: To be implemented later for email notifications to admins
   */
  async notifyAdminsBillingCreatedEmail(
    billing: Billing,
    createdBy?: string,
  ): Promise<void> {
    // TODO: Implement email notifications to admins and platform owners
    // This will send email notifications when:
    // - A new billing is created
    // - Billing status changes (paid, failed, pending)
    // - Payment issues occur
    this.logger.log(
      `📧 [PLACEHOLDER] Email notification to admins for billing ${billing.id} - To be implemented`,
    );
  }

  /**
   * Send email notification to admins and platform owners when billing status changes
   * PLACEHOLDER: To be implemented later for email notifications to admins
   */
  async notifyAdminsBillingStatusChangedEmail(
    billing: Billing,
    status: string,
    reason?: string,
  ): Promise<void> {
    // TODO: Implement email notifications to admins and platform owners
    // This will send email notifications when billing status changes to:
    // - PAID: Success notification
    // - FAILED: Alert notification with failure reason
    // - PENDING: Reminder notification
    // - OVERDUE: Urgent notification
    this.logger.log(
      `📧 [PLACEHOLDER] Email notification to admins for billing ${billing.id} status change to ${status} - To be implemented`,
    );
  }
}
