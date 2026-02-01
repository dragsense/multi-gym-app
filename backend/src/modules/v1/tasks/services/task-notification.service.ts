import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '@/common/notification/notification.service';
import {
  ENotificationPriority,
  ENotificationType,
} from '@shared/enums/notification.enum';
import { Task } from '../entities/task.entity';
import { TaskComment } from '../entities/task-comment.entity';
import { ETaskStatus, ETaskPriority } from '@shared/enums/task.enum';

@Injectable()
export class TaskNotificationService {
  private readonly logger = new Logger(TaskNotificationService.name);

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Send notification when a task is assigned to a user
   */
  async notifyTaskAssigned(
    task: Task,
    userId: string,
  ): Promise<void> {
    try {
      const assignerName = task.createdBy?.firstName || 
                          task.createdBy?.email || 
                          'Someone';
      
      await this.notificationService.createNotification({
        title: 'New Task Assigned',
        message: `${assignerName} assigned you a task: "${task.title}"`,
        type: ENotificationType.INFO,
        priority: this.getPriorityLevel(task.priority),
        entityId: userId,
        entityType: 'task',
        metadata: {
          action: 'task_assigned',
          taskId: task.id,
          taskTitle: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
        },
      });

      this.logger.log(
        `✅ Notification sent for task assignment ${task.id} to user ${userId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for task assignment ${task.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when a task is unassigned from a user
   */
  async notifyTaskUnassigned(
    task: Task,
    userId: string,
  ): Promise<void> {
    try {
      await this.notificationService.createNotification({
        title: 'Task Unassigned',
        message: `You have been unassigned from task: "${task.title}"`,
        type: ENotificationType.INFO,
        priority: ENotificationPriority.NORMAL,
        entityId: userId,
        entityType: 'task',
        metadata: {
          action: 'task_unassigned',
          taskId: task.id,
          taskTitle: task.title,
        },
      });

      this.logger.log(
        `✅ Notification sent for task unassignment ${task.id} to user ${userId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for task unassignment ${task.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when task status changes
   */
  async notifyStatusChanged(
    task: Task,
    previousAssigneeId?: string,
  ): Promise<void> {
    try {
      const statusMessages: Record<ETaskStatus, string> = {
        [ETaskStatus.TODO]: 'moved to To Do',
        [ETaskStatus.IN_PROGRESS]: 'started',
        [ETaskStatus.IN_REVIEW]: 'moved to In Review',
        [ETaskStatus.DONE]: 'completed',
        [ETaskStatus.CANCELLED]: 'cancelled',
      };

      const message = statusMessages[task.status] || 'updated';
      const notificationTitle = task.status === ETaskStatus.DONE 
        ? 'Task Completed' 
        : 'Task Status Updated';

      // Notify the assignee if they exist
      if (task.assignedTo?.id) {
        await this.notificationService.createNotification({
          title: notificationTitle,
          message: `Task "${task.title}" has been ${message}`,
          type: task.status === ETaskStatus.DONE 
            ? ENotificationType.SUCCESS 
            : ENotificationType.INFO,
          priority: this.getPriorityLevel(task.priority),
          entityId: task.assignedTo.id,
          entityType: 'task',
          metadata: {
            action: 'task_status_changed',
            taskId: task.id,
            taskTitle: task.title,
            previousStatus: previousAssigneeId ? 'unknown' : undefined,
            newStatus: task.status,
          },
        });
      }

      // Notify the creator if they're different from assignee
      if (task.createdBy?.id && 
          task.createdBy.id !== task.assignedTo?.id) {
        await this.notificationService.createNotification({
          title: notificationTitle,
          message: `Task "${task.title}" has been ${message}`,
          type: task.status === ETaskStatus.DONE 
            ? ENotificationType.SUCCESS 
            : ENotificationType.INFO,
          priority: this.getPriorityLevel(task.priority),
          entityId: task.createdBy.id,
          entityType: 'task',
          metadata: {
            action: 'task_status_changed',
            taskId: task.id,
            taskTitle: task.title,
            newStatus: task.status,
          },
        });
      }

      this.logger.log(
        `✅ Notification sent for status change ${task.id} to status ${task.status}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for status change ${task.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when a comment is added to a task
   */
  async notifyCommentAdded(
    task: Task,
    comment: TaskComment,
    commenterId: string,
  ): Promise<void> {
    try {
      const commenterName = comment.createdBy?.firstName || 
                           comment.createdBy?.email || 
                           'Someone';
      
      // Notify the assignee if they exist and are not the commenter
      if (task.assignedTo?.id && task.assignedTo.id !== commenterId) {
        await this.notificationService.createNotification({
          title: 'New Comment on Task',
          message: `${commenterName} commented on task: "${task.title}"`,
          type: ENotificationType.INFO,
          priority: ENotificationPriority.NORMAL,
          entityId: task.assignedTo.id,
          entityType: 'task',
          metadata: {
            action: 'task_comment_added',
            taskId: task.id,
            taskTitle: task.title,
            commentId: comment.id,
            commenterId,
          },
        });
      }

      // Notify the creator if they're different from commenter and assignee
      if (task.createdBy?.id && 
          task.createdBy.id !== commenterId &&
          task.createdBy.id !== task.assignedTo?.id) {
        await this.notificationService.createNotification({
          title: 'New Comment on Task',
          message: `${commenterName} commented on task: "${task.title}"`,
          type: ENotificationType.INFO,
          priority: ENotificationPriority.NORMAL,
          entityId: task.createdBy.id,
          entityType: 'task',
          metadata: {
            action: 'task_comment_added',
            taskId: task.id,
            taskTitle: task.title,
            commentId: comment.id,
            commenterId,
          },
        });
      }

      this.logger.log(
        `✅ Notification sent for comment ${comment.id} on task ${task.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for comment ${comment.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when a task is approaching its due date
   */
  async notifyDueDateApproaching(
    task: Task,
    daysUntilDue: number,
  ): Promise<void> {
    try {
      if (!task.assignedTo?.id) {
        return;
      }

      const urgencyMessage = daysUntilDue === 0 
        ? 'is due today'
        : daysUntilDue === 1
        ? 'is due tomorrow'
        : `is due in ${daysUntilDue} days`;

      await this.notificationService.createNotification({
        title: 'Task Due Date Reminder',
        message: `Task "${task.title}" ${urgencyMessage}`,
        type: daysUntilDue <= 1 
          ? ENotificationType.WARNING 
          : ENotificationType.INFO,
        priority: daysUntilDue <= 1 
          ? ENotificationPriority.HIGH 
          : ENotificationPriority.NORMAL,
        entityId: task.assignedTo.id,
        entityType: 'task',
        metadata: {
          action: 'task_due_date_approaching',
          taskId: task.id,
          taskTitle: task.title,
          dueDate: task.dueDate,
          daysUntilDue,
        },
      });

      this.logger.log(
        `✅ Notification sent for approaching due date for task ${task.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for due date reminder ${task.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when a task becomes overdue
   */
  async notifyTaskOverdue(
    task: Task,
  ): Promise<void> {
    try {
      if (!task.assignedTo?.id) {
        return;
      }

      await this.notificationService.createNotification({
        title: 'Task Overdue',
        message: `Task "${task.title}" is overdue`,
        type: ENotificationType.WARNING,
        priority: ENotificationPriority.URGENT,
        entityId: task.assignedTo.id,
        entityType: 'task',
        metadata: {
          action: 'task_overdue',
          taskId: task.id,
          taskTitle: task.title,
          dueDate: task.dueDate,
        },
      });

      this.logger.log(
        `✅ Notification sent for overdue task ${task.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for overdue task ${task.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Send notification when a task is updated (general update)
   */
  async notifyTaskUpdated(
    task: Task,
    updatedBy?: string,
  ): Promise<void> {
    try {
      // Notify the assignee if they exist
      if (task.assignedTo?.id) {
        await this.notificationService.createNotification({
          title: 'Task Updated',
          message: `Task "${task.title}" has been updated`,
          type: ENotificationType.INFO,
          priority: this.getPriorityLevel(task.priority),
          entityId: task.assignedTo.id,
          entityType: 'task',
          metadata: {
            action: 'task_updated',
            taskId: task.id,
            taskTitle: task.title,
            updatedBy,
          },
        });
      }

      // Notify the creator if they're different from assignee
      if (task.createdBy?.id && 
          task.createdBy.id !== task.assignedTo?.id) {
        await this.notificationService.createNotification({
          title: 'Task Updated',
          message: `Task "${task.title}" has been updated`,
          type: ENotificationType.INFO,
          priority: this.getPriorityLevel(task.priority),
          entityId: task.createdBy.id,
          entityType: 'task',
          metadata: {
            action: 'task_updated',
            taskId: task.id,
            taskTitle: task.title,
            updatedBy,
          },
        });
      }

      this.logger.log(
        `✅ Notification sent for task update ${task.id}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ Failed to send notification for task update ${task.id}: ${errorMessage}`,
      );
    }
  }

  /**
   * Convert task priority to notification priority
   */
  private getPriorityLevel(taskPriority: ETaskPriority): ENotificationPriority {
    switch (taskPriority) {
      case ETaskPriority.URGENT:
        return ENotificationPriority.URGENT;
      case ETaskPriority.HIGH:
        return ENotificationPriority.HIGH;
      case ETaskPriority.MEDIUM:
        return ENotificationPriority.NORMAL;
      case ETaskPriority.LOW:
        return ENotificationPriority.LOW;
      default:
        return ENotificationPriority.NORMAL;
    }
  }
}

