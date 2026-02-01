import { Injectable, Logger } from '@nestjs/common';

import { NotificationService } from '@/common/notification/notification.service';
import {
  ENotificationPriority,
  ENotificationType,
} from '@shared/enums/notification.enum';
import { Session } from '../entities/session.entity';
import { BaseUsersService } from '@/common/base-user/base-users.service';

@Injectable()
export class SessionNotificationService {
  private readonly logger = new Logger(SessionNotificationService.name);

  constructor(
    private readonly baseUsersService: BaseUsersService,
    private readonly notificationService: NotificationService,
  ) {}
  async notifyTrainerSessionCreated(
    session: Session,
    createdBy?: string,
  ): Promise<void> {
    try {
      const trainerUserId = session.trainer.user?.id;
      if (!trainerUserId) {
        return;
      }

      await this.notificationService.createNotification({
        title: 'New Session Scheduled',
        //UTC Keyword added at last
        message: `A new session "${session.title}" has been scheduled for ${new Date(session.startDateTime).toLocaleString()} (UTC).`,
        type: ENotificationType.SUCCESS,
        priority: ENotificationPriority.NORMAL,
        entityId: trainerUserId,
        entityType: 'session',
        emailSubject: `New Session: ${session.title}`,
        metadata: {
          action: 'session_created',
          sessionId: session.id,
          startDateTime: session.startDateTime,
          createdBy,
        },
      });

      this.logger.log(
        `✅ Notification sent to trainer for session ${session.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification to trainer for session ${session.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification to members when session is created
   */
  async notifyMembersSessionCreated(
    session: Session,
    createdBy?: string,
  ): Promise<void> {
    try {
      const memberNotifications = session.members.map((member) => {
        const memberUserId = member.user?.id;
        if (!memberUserId) return null;

        return this.notificationService.createNotification({
          title: 'New Session Scheduled',
          //UTC Keyword added at last
          message: `You have been added to a session "${session.title}" scheduled for ${new Date(session.startDateTime).toLocaleString()} (UTC).`,
          type: ENotificationType.SUCCESS,
          priority: ENotificationPriority.NORMAL,
          entityId: memberUserId,
          entityType: 'session',
          emailSubject: `New Session: ${session.title}`,
          metadata: {
            action: 'session_created',
            sessionId: session.id,
            startDateTime: session.startDateTime,
            createdBy,
          },
        });
      });

      await Promise.all(
        memberNotifications.filter((promise) => promise !== null),
      );

      this.logger.log(
        `✅ Notifications sent to ${session.members.length} member(s) for session ${session.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notifications to members for session ${session.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when session is updated
   */
  async notifySessionUpdated(
    session: Session,
    updatedBy?: string,
  ): Promise<void> {
    try {
      const trainerUserId = session.trainer.user?.id;
      const notifications: Promise<void>[] = [];

      // Notify trainer
      if (trainerUserId) {
        notifications.push(
          this.notificationService
            .createNotification({
              title: 'Session Updated',
              message: `The session "${session.title}" has been updated.`,
              type: ENotificationType.INFO,
              priority: ENotificationPriority.NORMAL,
              entityId: trainerUserId,
              entityType: 'session',
              emailSubject: `Session Updated: ${session.title}`,
              metadata: {
                action: 'session_updated',
                sessionId: session.id,
                updatedBy,
              },
            })
            .then(() => {}),
        );
      }

      // Notify members
      session.members.forEach((member) => {
        const memberUserId = member.user?.id;
        if (memberUserId) {
          notifications.push(
            this.notificationService
              .createNotification({
                title: 'Session Updated',
                message: `The session "${session.title}" has been updated.`,
                type: ENotificationType.INFO,
                priority: ENotificationPriority.NORMAL,
                entityId: memberUserId,
                entityType: 'session',
                emailSubject: `Session Updated: ${session.title}`,
                metadata: {
                  action: 'session_updated',
                  sessionId: session.id,
                  updatedBy,
                },
              })
              .then(() => {}),
          );
        }
      });

      await Promise.all(notifications);

      this.logger.log(
        `✅ Notifications sent for updated session ${session.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notifications for updated session ${session.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when session is deleted
   */
  async notifySessionDeleted(
    session: Session,
    deletedBy?: string,
  ): Promise<void> {
    try {
      const trainerUserId = session.trainer.user?.id;
      const notifications: Promise<void>[] = [];

      // Notify trainer
      if (trainerUserId) {
        notifications.push(
          this.notificationService
            .createNotification({
              title: 'Session Deleted',
              message: `The session "${session.title}" scheduled for ${new Date(session.startDateTime).toLocaleString()} has been deleted.`,
              type: ENotificationType.WARNING,
              priority: ENotificationPriority.HIGH,
              entityId: trainerUserId,
              entityType: 'session',
              emailSubject: `Session Deleted: ${session.title}`,
              metadata: {
                action: 'session_deleted',
                sessionId: session.id,
                startDateTime: session.startDateTime,
                deletedBy,
              },
            })
            .then(() => {}),
        );
      }

      // Notify members
      session.members.forEach((member) => {
        const memberUserId = member.user?.id;
        if (memberUserId) {
          notifications.push(
            this.notificationService
              .createNotification({
                title: 'Session Cancelled',
                message: `The session "${session.title}" scheduled for ${new Date(session.startDateTime).toLocaleString()} has been cancelled.`,
                type: ENotificationType.WARNING,
                priority: ENotificationPriority.HIGH,
                entityId: memberUserId,
                entityType: 'session',
                emailSubject: `Session Cancelled: ${session.title}`,
                metadata: {
                  action: 'session_deleted',
                  sessionId: session.id,
                  startDateTime: session.startDateTime,
                  deletedBy,
                },
              })
              .then(() => {}),
          );
        }
      });

      await Promise.all(notifications);

      this.logger.log(
        `✅ Notifications sent for deleted session ${session.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notifications for deleted session ${session.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification to admins when session is created
   */
  /*  async notifyAdminsSessionCreated(
    session: Session,
    createdBy?: string,
  ): Promise<void> {
    try {
      const adminUsers = await this.baseUsersService.get({
        where: {
          level: In([EUserLevels.SUPER_ADMIN]),
          isActive: true,
        },
        select: ['id', 'email', 'firstName', 'lastName'],
      });

      if (adminUsers.length === 0) {
        return;
      }

      const notificationPromises = adminUsers.map((admin) =>
        this.notificationService.createNotification({
          title: 'New Session Created',
          message: `A new session "${session.title}" has been scheduled.`,
          type: ENotificationType.INFO,
          priority: ENotificationPriority.NORMAL,
          entityId: admin.id,
          entityType: 'session',
          metadata: {
            action: 'session_created',
            sessionId: session.id,
            trainerUserId: session.trainer.user?.id,
            createdBy,
          },
        }),
      );

      await Promise.all(notificationPromises);

      this.logger.log(
        `✅ Notifications sent to ${adminUsers.length} admin(s) for session ${session.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send admin notifications for session ${session.id}: ${errorMessage}`,
      );
    }
  } */
}
