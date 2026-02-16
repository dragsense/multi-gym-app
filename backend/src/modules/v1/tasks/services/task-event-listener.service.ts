import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TasksService } from '../tasks.service';
import { Task } from '../entities/task.entity';
import { EventPayload } from '@/common/helper/services/event.service';
import { TaskNotificationService } from './task-notification.service';
import { ActionRegistryService } from '@/common/helper/services/action-registry.service';
import { TaskEmailService } from './task-email.service';
import { UsersService } from '@/modules/v1/users/users.service';
import { ScheduleService } from '@/common/schedule/schedule.service';
import {
  EScheduleFrequency,
  EScheduleStatus,
} from '@shared/enums/schedule.enum';
import { RequestContext } from '@/common/context/request-context';

@Injectable()
export class TaskEventListenerService implements OnModuleInit {
  private readonly logger = new Logger(TaskEventListenerService.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly taskNotificationService: TaskNotificationService,
    private readonly actionRegistryService: ActionRegistryService,
    private readonly taskEmailService: TaskEmailService,
    private readonly usersService: UsersService,
    private readonly scheduleService: ScheduleService,
    @InjectQueue('task') private taskQueue: Queue,
  ) {}

  onModuleInit() {
    // Register task actions with action registry
    this.actionRegistryService.registerAction('mark-task-due-date-passed', {
      handler: this.handleMarkTaskDueDatePassed.bind(this),
      description: 'Mark task as passed when due date passes',
      retryable: true,
      timeout: 10000,
    });

    this.logger.log('TaskEventListenerService initialized');
  }

  /**
   * Handle task created event - send notifications and create activity log
   */
  @OnEvent('task.crud.create')
  async handleTaskCreated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    const data = payload.data as { createdBy?: string; tenantId?: string };
    const tenantId = data?.tenantId;

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const task = await this.tasksService.getSingle(payload.entityId, {
          _relations: ['assignedTo', 'createdBy'],
        });
        if (!task) throw new NotFoundException('Task not found');
        this.logger.log(`Task created: ${task.title} (ID: ${task.id})`);

        const createdByUserId = data?.createdBy || task.createdBy?.id;

        // Activity log is now handled by TaskSubscriber

        // Send notification to assigned user if task is assigned
        if (task.assignedTo) {
          await this.taskNotificationService.notifyTaskAssigned(
            task,
            task.assignedTo.id,
          );

          // Queue email for assigned user
          if (task.assignedTo.email) {
            await this.taskQueue.add(
              'send-task-created',
              {
                taskId: task.id,
                recipientId: task.assignedTo.id,
                tenantId, // Pass tenant context for background job
              },
              {
                delay: 10000,
              },
            );
          }
        }

        // Schedule automatic marking of task when due date passes (for recurring tasks)
        await this.scheduleTaskAutoPass(task, tenantId);
      } catch (error) {
        this.logger.error(
          `Failed to handle task creation for task ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Handle task updated event - send notifications and create activity log
   */
  @OnEvent('task.crud.update')
  async handleTaskUpdated(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    const data = payload.data as { updatedBy?: string; tenantId?: string };
    const tenantId = data?.tenantId;

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const task = await this.tasksService.getSingle(payload.entityId, {
          _relations: ['assignedTo', 'createdBy'],
        });
        if (!task) throw new NotFoundException('Task not found');
        this.logger.log(`Task updated: ${task.title} (ID: ${task.id})`);

        const oldTask = payload.oldEntity as Task | undefined;

        if (!oldTask) return;

        // Activity log is now handled by TaskSubscriber

        // Notify if task was assigned to a new user
        if (oldTask.assignedTo?.id !== task.assignedTo?.id) {
          if (oldTask.assignedTo?.id) {
            await this.taskNotificationService.notifyTaskUnassigned(
              task,
              oldTask.assignedTo.id,
            );
          }
          if (task.assignedTo?.id) {
            await this.taskNotificationService.notifyTaskAssigned(
              task,
              task.assignedTo.id,
            );

            // Queue email for newly assigned user
            if (task.assignedTo.email) {
              await this.taskQueue.add(
                'send-task-assigned',
                {
                  taskId: task.id,
                  recipientId: task.assignedTo.id,
                  tenantId, // Pass tenant context for background job
                },
                {
                  delay: 10000,
                },
              );
            }
          }
        }

        // Notify if task status changed
        if (oldTask.status !== task.status) {
          // For recurring tasks, check and create actual tasks for past dates
          // This is handled in tasks.service.ts updateTask beforeUpdate callback
          // but we ensure it's called here as well for safety
          if (task.enableRecurrence && task.dueDate) {
            try {
              await this.tasksService.checkActualTasksAndCreate(task);
            } catch (error) {
              this.logger.error(
                `Failed to check and create actual tasks for task ${task.id}:`,
                error,
              );
            }
          }

          await this.taskNotificationService.notifyStatusChanged(
            task,
            oldTask.assignedTo?.id,
          );

          // Queue status update email
          if (task.assignedTo?.email) {
            await this.taskQueue.add(
              'send-task-status-update',
              {
                taskId: task.id,
                recipientId: task.assignedTo.id,
                tenantId, // Pass tenant context for background job
              },
              {
                delay: 10000,
              },
            );
          }
        } else {
          // Notify general update if status didn't change
          await this.taskNotificationService.notifyTaskUpdated(
            task,
            data?.updatedBy,
          );

          // Queue general update email
          if (task.assignedTo?.email) {
            await this.taskQueue.add(
              'send-task-updated',
              {
                taskId: task.id,
                recipientId: task.assignedTo.id,
                tenantId, // Pass tenant context for background job
              },
              {
                delay: 10000,
              },
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to handle task update for task ${payload.entityId}:`,
          error,
        );
      }
    });
  }


  /**
   * Handle task deleted event - cleanup if needed
   */
  @OnEvent('task.crud.delete')
  async handleTaskDeleted(payload: EventPayload): Promise<void> {
    if (!payload.entity) return;

    const tenantId = (payload.data as any)?.tenantId;

    // Execute within RequestContext.run() to create a new async context
    await RequestContext.run(async () => {
      if (tenantId) {
        RequestContext.set('tenantId', tenantId);
      }

      try {
        const task = payload.entity as Task;
        this.logger.log(`Task deleted: ${task.title} (ID: ${task.id})`);

        // Remove all associated schedules
        await this.removeTaskSchedules(task.id);

        // Any cleanup logic can go here
      } catch (error) {
        this.logger.error(
          `Failed to handle task deletion for task ${payload.entityId}:`,
          error,
        );
      }
    });
  }

  /**
   * Schedule automatic marking of a task when due date passes
   * For recurring tasks, creates a recurring schedule based on recurrence config
   * @param tenantId - Tenant ID for multi-tenant database routing (passed from event payload)
   */
  private async scheduleTaskAutoPass(task: Task, tenantId?: string): Promise<void> {
    try {
      if (!task.enableRecurrence || !task.startDateTime) {
        this.logger.log(
          `Task ${task.title} is not recurring or has no start date, skipping auto-pass`,
        );
        return;
      }

      // Calculate start date/time for the first occurrence
      const startDateTime = task.startDateTime;

      // Extract time of day from start date (HH:MM format)
      const hours = startDateTime.getHours().toString().padStart(2, '0');
      const minutes = startDateTime.getMinutes().toString().padStart(2, '0');
      const timeOfDay = `${hours}:${minutes}`;

      // Create recurring schedule with same frequency config
      await this.scheduleService.createSchedule({
        title: `Task Auto-Pass - ${task.title}`,
        description: `Auto mark ${task.title} as passed when start date passes (recurring)`,
        action: 'mark-task-due-date-passed',
        entityId: task.id,
        frequency:
          task.recurrenceConfig?.frequency || EScheduleFrequency.ONCE,
        weekDays: task.recurrenceConfig?.weekDays || [],
        monthDays: task.recurrenceConfig?.monthDays || [],
        startDate: task.startDateTime.toISOString(),
        endDate: task.recurrenceEndDate?.toISOString() || undefined,
        timeOfDay: timeOfDay,
        retryOnFailure: true,
        tenantId, // Include tenant context for multi-tenant database routing
        data: {
          taskId: task.id,
          tenantId, // Also store in data for action handlers
        },
      });

      this.logger.log(
        `Scheduled auto-pass for task ${task.title} at ${startDateTime.toISOString()}${tenantId ? ` (tenant: ${tenantId})` : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule auto-pass for task ${task.id}:`,
        error,
      );
    }
  }

  /**
   * Remove all schedules for a task
   */
  private async removeTaskSchedules(taskId: string): Promise<void> {
    try {
      // Find and remove all schedules associated with this task
      const schedules = await this.scheduleService.getAll(
        { entityId: taskId },
        {},
      );

      for (const schedule of schedules) {
        await this.scheduleService.delete(schedule.id);
      }

      this.logger.log(
        `Removed ${schedules.length} schedule(s) for task ID: ${taskId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove schedules for task ${taskId}:`,
        error,
      );
    }
  }

  /**
   * Handle mark task due date passed
   */
  private async handleMarkTaskDueDatePassed(data: any): Promise<void> {
    const { taskId } = data as { taskId: string };
    try {
      const idWithDateParts = taskId.split('@');
      const originalTaskId = idWithDateParts[0];

      const existingTask = await this.tasksService.getSingle(originalTaskId, {
        _relations: ['assignedTo', 'createdBy'],
      });

      if (!existingTask) {
        throw new NotFoundException('Task not found');
      }

      // Check and create actual tasks for past dates
      await this.tasksService.checkActualTasksAndCreate(existingTask);

      this.logger.log(`Checked and created actual tasks for: ${taskId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle task due date passed: ${taskId}:`,
        error,
      );
      throw error;
    }
  }
}
