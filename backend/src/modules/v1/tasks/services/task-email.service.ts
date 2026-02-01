import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Task } from '../entities/task.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { EmailTemplateService } from '@/common/email/email-template.service';

export enum TaskEmailType {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_UPDATE = 'status_update',
  ASSIGNED = 'assigned',
  DELETED = 'deleted',
}

export interface TaskEmailContext {
  task: Task;
  recipientEmail?: string;
  recipientName?: string;
  emailType?: TaskEmailType;
}

interface TaskEmailTemplateData {
  task: Task;
  recipientEmail: string;
  recipientName: string;
  loginUrl: string;
  taskUrl: string;
  emailType: TaskEmailType;
}

@Injectable()
export class TaskEmailService {
  private readonly logger = new LoggerService(TaskEmailService.name);
  private readonly appConfig: any;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {
    this.appConfig = this.configService.get('app');
  }

  /**
   * Send task created email
   */
  async sendTaskCreated(
    task: Task,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: TaskEmailContext = {
        task,
        emailType: TaskEmailType.CREATED,
        recipientEmail,
        recipientName,
      };

      await this.sendTaskEmail(context);
      this.logger.log(
        `Task created email sent for task: ${task.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send task created email for task ${task.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send task updated email
   */
  async sendTaskUpdated(
    task: Task,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: TaskEmailContext = {
        task,
        emailType: TaskEmailType.UPDATED,
        recipientEmail,
        recipientName,
      };

      await this.sendTaskEmail(context);
      this.logger.log(
        `Task updated email sent for task: ${task.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send task updated email for task ${task.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send task status update email
   */
  async sendTaskStatusUpdate(
    task: Task,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: TaskEmailContext = {
        task,
        emailType: TaskEmailType.STATUS_UPDATE,
        recipientEmail,
        recipientName,
      };

      await this.sendTaskEmail(context);
      this.logger.log(
        `Task status update email sent for task: ${task.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send task status update email for task ${task.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send task assigned email
   */
  async sendTaskAssigned(
    task: Task,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: TaskEmailContext = {
        task,
        emailType: TaskEmailType.ASSIGNED,
        recipientEmail,
        recipientName,
      };

      await this.sendTaskEmail(context);
      this.logger.log(
        `Task assigned email sent for task: ${task.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send task assigned email for task ${task.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send task deleted email
   */
  async sendTaskDeleted(
    task: Task,
    recipientEmail: string,
    recipientName: string,
  ): Promise<void> {
    try {
      const context: TaskEmailContext = {
        task,
        emailType: TaskEmailType.DELETED,
        recipientEmail,
        recipientName,
      };

      await this.sendTaskEmail(context);
      this.logger.log(
        `Task deleted email sent for task: ${task.title}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send task deleted email for task ${task.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Generic method to send task-related emails
   */
  private async sendTaskEmail(context: TaskEmailContext): Promise<void> {
    try {
      const {
        task,
        recipientEmail,
        recipientName,
        emailType,
      } = context;

      if (!recipientEmail) {
        this.logger.warn(`No recipient email found for task ${task.id}`);
        return;
      }

      const templateData: TaskEmailTemplateData = {
        task,
        recipientEmail,
        recipientName: recipientName || 'User',
        loginUrl: `${this.appConfig.frontendUrl}/login`,
        taskUrl: `${this.appConfig.frontendUrl}/tasks`,
        emailType: emailType || TaskEmailType.UPDATED,
      };

      const emailConfig = this.getEmailConfig(
        emailType || TaskEmailType.UPDATED,
      );

      await this.mailerService.sendMail({
        to: recipientEmail,
        subject: emailConfig.subject,
        html: this.generateTaskEmailHTML(
          templateData,
          emailType || TaskEmailType.UPDATED,
        ),
        text: this.generateTaskEmailText(
          templateData,
          emailType || TaskEmailType.UPDATED,
        ),
      });
    } catch (error) {
      this.logger.error(`Failed to send task email:`, error);
      throw error;
    }
  }

  /**
   * Get email configuration based on email type
   */
  private getEmailConfig(emailType: TaskEmailType) {
    const baseUrl = this.appConfig.frontendUrl;

    switch (emailType) {
      case TaskEmailType.CREATED:
        return {
          subject: 'Task Created - New Task Assigned to You',
          template: 'task-created',
        };

      case TaskEmailType.UPDATED:
        return {
          subject: 'Task Updated - Task Details Have Changed',
          template: 'task-updated',
        };

      case TaskEmailType.STATUS_UPDATE:
        return {
          subject: 'Task Status Update - Task Status Has Changed',
          template: 'task-status-update',
        };

      case TaskEmailType.ASSIGNED:
        return {
          subject: 'Task Assigned - You Have Been Assigned a New Task',
          template: 'task-assigned',
        };

      case TaskEmailType.DELETED:
        return {
          subject: 'Task Deleted - Task Has Been Removed',
          template: 'task-deleted',
        };

      default:
        return {
          subject: 'Task Update',
          template: 'task-default',
        };
    }
  }

  /**
   * Generate HTML email template for task emails
   */
  private generateTaskEmailHTML(
    data: TaskEmailTemplateData,
    emailType: TaskEmailType,
  ): string {
    const { task, recipientName, taskUrl } = data;
    const appName = this.appConfig.name;
    const dueDate = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString()
      : 'Not set';

    const getEmailContent = () => {
      switch (emailType) {
        case TaskEmailType.CREATED:
          return {
            title: 'Task Created',
            message: `A new task "${task.title}" has been created and assigned to you.`,
            actionText: 'View Task Details',
            actionUrl: taskUrl,
            additionalInfo: 'Please review the task details and start working on it.',
          };
        case TaskEmailType.UPDATED:
          return {
            title: 'Task Updated',
            message: `The task "${task.title}" has been updated.`,
            actionText: 'View Task Details',
            actionUrl: taskUrl,
            additionalInfo: 'Please check the updated details for any changes.',
          };
        case TaskEmailType.STATUS_UPDATE:
          return {
            title: 'Task Status Update',
            message: `The status of task "${task.title}" has been updated.`,
            actionText: 'View Task Details',
            actionUrl: taskUrl,
            additionalInfo: 'Please check the updated status.',
          };
        case TaskEmailType.ASSIGNED:
          return {
            title: 'Task Assigned',
            message: `You have been assigned to the task "${task.title}".`,
            actionText: 'View Task Details',
            actionUrl: taskUrl,
            additionalInfo: 'Please review the task and start working on it.',
          };
        case TaskEmailType.DELETED:
          return {
            title: 'Task Deleted',
            message: `The task "${task.title}" has been deleted.`,
            actionText: 'View Other Tasks',
            actionUrl: taskUrl,
            additionalInfo: 'If you have any questions, please contact your manager.',
          };
        default:
          return {
            title: 'Task Update',
            message: `The task "${task.title}" has been updated.`,
            actionText: 'View Task Details',
            actionUrl: taskUrl,
            additionalInfo: 'Please check the details for any changes.',
          };
      }
    };

    const content = getEmailContent();

    const taskDetails = `
      <div class="info-box">
        <p style="margin: 0 0 8px 0;"><strong>Title:</strong> ${task.title}</p>
        ${task.description ? `<p style="margin: 0 0 8px 0;"><strong>Description:</strong> ${task.description}</p>` : ''}
        <p style="margin: 0 0 8px 0;"><strong>Status:</strong> ${task.status || 'TODO'}</p>
        <p style="margin: 0 0 8px 0;"><strong>Priority:</strong> ${task.priority || 'MEDIUM'}</p>
        <p style="margin: 0 0 8px 0;"><strong>Due Date:</strong> ${dueDate}</p>
        ${task.progress !== undefined ? `<p style="margin: 0;"><strong>Progress:</strong> ${task.progress}%</p>` : ''}
      </div>
    `;

    return this.emailTemplateService.generateHTML({
      title: content.title,
      greeting: `Dear ${recipientName}`,
      content: `
        <p>${content.message}</p>
        ${taskDetails}
        ${content.additionalInfo ? `<p style="margin-top: 16px;">${content.additionalInfo}</p>` : ''}
      `,
      actionButton: {
        text: content.actionText,
        url: content.actionUrl,
      },
      appName,
    });
  }

  /**
   * Generate text email template for task emails
   */
  private generateTaskEmailText(
    data: TaskEmailTemplateData,
    emailType: TaskEmailType,
  ): string {
    const { task, recipientName, taskUrl } = data;
    const appName = this.appConfig.name;
    const dueDate = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString()
      : 'Not set';

    const getEmailContent = () => {
      switch (emailType) {
        case TaskEmailType.CREATED:
          return {
            title: 'Task Created',
            message: `A new task "${task.title}" has been created and assigned to you.`,
            additionalInfo: 'Please review the task details and start working on it.',
          };
        case TaskEmailType.UPDATED:
          return {
            title: 'Task Updated',
            message: `The task "${task.title}" has been updated.`,
            additionalInfo: 'Please check the updated details for any changes.',
          };
        case TaskEmailType.STATUS_UPDATE:
          return {
            title: 'Task Status Update',
            message: `The status of task "${task.title}" has been updated.`,
            additionalInfo: 'Please check the updated status.',
          };
        case TaskEmailType.ASSIGNED:
          return {
            title: 'Task Assigned',
            message: `You have been assigned to the task "${task.title}".`,
            additionalInfo: 'Please review the task and start working on it.',
          };
        case TaskEmailType.DELETED:
          return {
            title: 'Task Deleted',
            message: `The task "${task.title}" has been deleted.`,
            additionalInfo: 'If you have any questions, please contact your manager.',
          };
        default:
          return {
            title: 'Task Update',
            message: `The task "${task.title}" has been updated.`,
            additionalInfo: 'Please check the details for any changes.',
          };
      }
    };

    const content = getEmailContent();

    const taskDetailsText = `
Title: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
Status: ${task.status || 'TODO'}
Priority: ${task.priority || 'MEDIUM'}
Due Date: ${dueDate}
${task.progress !== undefined ? `Progress: ${task.progress}%` : ''}
    `;

    return this.emailTemplateService.generateText({
      title: content.title,
      greeting: `Dear ${recipientName}`,
      content: `
${content.message}

Task Details:
${taskDetailsText}
${content.additionalInfo ? `\n${content.additionalInfo}` : ''}
      `,
      actionButton: {
        text: 'View Task Details',
        url: taskUrl,
      },
      appName,
    });
  }
}

