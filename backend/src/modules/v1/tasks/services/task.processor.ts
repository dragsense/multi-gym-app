import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TaskEmailService } from './task-email.service';
import { TasksService } from '../tasks.service';
import { UsersService } from '@/modules/v1/users/users.service';
import { RequestContext } from '@/common/context/request-context';

@Processor('task')
@Injectable()
export class TaskProcessor {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(
    private readonly taskEmailService: TaskEmailService,
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService,
  ) {
    this.logger.log('✅ TaskProcessor initialized and listening for jobs');
  }

  /**
   * Handle send task created email
   */
  @Process('send-task-created')
  async handleSendTaskCreated(job: Job): Promise<void> {
    const { taskId, recipientId, tenantId } = job.data;

    this.logger.log(`Processing task created email for task ${taskId}`);

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const task = await this.tasksService.getSingle(taskId);
        if (!task) throw new NotFoundException('Task not found');
        const user = await this.usersService.getUser(recipientId);

        await this.taskEmailService.sendTaskCreated(
          task,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Task created email sent successfully for task ${taskId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send task created email for task ${taskId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send task updated email
   */
  @Process('send-task-updated')
  async handleSendTaskUpdated(job: Job): Promise<void> {
    const { taskId, recipientId, tenantId } = job.data;

    this.logger.log(`Processing task updated email for task ${taskId}`);

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const task = await this.tasksService.getSingle(taskId);
        if (!task) throw new NotFoundException('Task not found');
        const user = await this.usersService.getUser(recipientId);

        await this.taskEmailService.sendTaskUpdated(
          task,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Task updated email sent successfully for task ${taskId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send task updated email for task ${taskId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send task status update email
   */
  @Process('send-task-status-update')
  async handleSendTaskStatusUpdate(job: Job): Promise<void> {
    const { taskId, recipientId, tenantId } = job.data;

    this.logger.log(
      `Processing task status update email for task ${taskId}`,
    );

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const task = await this.tasksService.getSingle(taskId);
        if (!task) throw new NotFoundException('Task not found');
        const user = await this.usersService.getUser(recipientId);

        await this.taskEmailService.sendTaskStatusUpdate(
          task,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Task status update email sent successfully for task ${taskId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send task status update email for task ${taskId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send task assigned email
   */
  @Process('send-task-assigned')
  async handleSendTaskAssigned(job: Job): Promise<void> {
    const { taskId, recipientId, tenantId } = job.data;

    this.logger.log(
      `Processing task assigned email for task ${taskId}`,
    );

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const task = await this.tasksService.getSingle(taskId);
        if (!task) throw new NotFoundException('Task not found');
        const user = await this.usersService.getUser(recipientId);

        await this.taskEmailService.sendTaskAssigned(
          task,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Task assigned email sent successfully for task ${taskId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send task assigned email for task ${taskId}:`,
          error,
        );
        throw error;
      }
    });
  }

  /**
   * Handle send task deleted email
   */
  @Process('send-task-deleted')
  async handleSendTaskDeleted(job: Job): Promise<void> {
    const { taskId, recipientId, tenantId } = job.data;

    this.logger.log(
      `Processing task deleted email for task ${taskId}`,
    );

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const task = await this.tasksService.getSingle(taskId);
        if (!task) throw new NotFoundException('Task not found');
        const user = await this.usersService.getUser(recipientId);

        await this.taskEmailService.sendTaskDeleted(
          task,
          user.email,
          user.firstName + ' ' + user.lastName,
        );

        this.logger.log(
          `Task deleted email sent successfully for task ${taskId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send task deleted email for task ${taskId}:`,
          error,
        );
        throw error;
      }
    });
  }
}
