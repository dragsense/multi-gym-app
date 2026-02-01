import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  DataSource,
} from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Task } from '../entities/task.entity';
import { TaskActivityLogService } from '../services/task-activity-log.service';
import { ModuleRef } from '@nestjs/core';

@EventSubscriber()
@Injectable()
export class TaskSubscriber implements EntitySubscriberInterface<Task> {
  private readonly logger = new Logger(TaskSubscriber.name);
  private taskActivityLogService: TaskActivityLogService | null = null;

  constructor(
    private readonly dataSource: DataSource,
    private readonly moduleRef: ModuleRef,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Task;
  }

  /**
   * Get the TaskActivityLogService lazily to avoid circular dependencies
   */
  private getTaskActivityLogService(): TaskActivityLogService {
    if (!this.taskActivityLogService) {
      this.taskActivityLogService = this.moduleRef.get(
        TaskActivityLogService,
        { strict: false },
      );
    }
    if (!this.taskActivityLogService) {
      throw new Error('TaskActivityLogService not found');
    }
    return this.taskActivityLogService;
  }

  /**
   * Called after a task is inserted
   */
  async afterInsert(event: InsertEvent<Task>): Promise<void> {
    const task = event.entity;

    if (!task?.id) {
      this.logger.warn('Task ID not found, skipping activity log creation');
      return;
    }

    try {
      const activityLogService = this.getTaskActivityLogService();
      const userId = task.createdByUserId || undefined;

      await activityLogService.createActivityLog(
        task.id,
        userId,
        'task_created',
        `Task "${task.title}" was created`,
        undefined, // No changes for creation
        undefined, // No updated fields for creation
      );

      this.logger.debug(`Activity log created for task creation: ${task.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to create activity log for task creation ${task.id}:`,
        error,
      );
    }
  }

  /**
   * Called after a task is updated
   */
  async afterUpdate(event: UpdateEvent<Task>): Promise<void> {
    const task = event.entity;

    if (!task?.id) {
      this.logger.warn('Task ID not found, skipping activity log creation');
      return;
    }

    try {
      const activityLogService = this.getTaskActivityLogService();
      const userId = task.updatedByUserId || task.createdByUserId || undefined;

      // Get changed fields from TypeORM's updatedColumns
      const changedFields = this.getChangedFields(event);
      const updatedFields = Object.keys(changedFields);

      // Only create activity log if there are actual field changes
      if (updatedFields.length > 0) {
        const activityType = this.getActivityType(changedFields);
        const description = this.generateActivityDescription(
          changedFields,
          task.title,
        );

        await activityLogService.createActivityLog(
          task.id,
          userId,
          activityType,
          description,
          changedFields,
          updatedFields,
        );

        this.logger.debug(
          `Activity log created for task update: ${task.id}, fields: ${updatedFields.join(', ')}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to create activity log for task update ${task.id}:`,
        error,
      );
    }
  }

  /**
   * Get changed fields from TypeORM UpdateEvent
   */
  private getChangedFields(
    event: UpdateEvent<Task>,
  ): Record<string, { oldValue: any; newValue: any }> {
    const changes: Record<string, { oldValue: any; newValue: any }> = {};

    // Fields to track for activity logs
    const fieldsToTrack = [
      'title',
      'description',
      'status',
      'priority',
      'dueDate',
      'progress',
      'assignedTo',
    ];

    for (const field of fieldsToTrack) {
      // Handle assignedTo separately - check the foreign key column
      if (field === 'assignedTo') {
        // Check if assignedToUserId column was updated
        const assignedToColumn = event.metadata.findColumnWithPropertyName('assignedToUserId');
        if (assignedToColumn) {
          const wasUpdated = event.updatedColumns.some(
            (col) => col.propertyName === 'assignedToUserId' || 
                     col.databaseName === assignedToColumn.databaseName,
          );

          if (wasUpdated) {
            const oldAssignedToId = (event.databaseEntity as any)?.assignedToUserId || null;
            const newAssignedToId = (event.entity as any)?.assignedToUserId || 
                                    (event.entity?.assignedTo?.id) || 
                                    null;
            
            // Only record change if IDs are actually different
            if (oldAssignedToId !== newAssignedToId) {
              changes[field] = {
                oldValue: oldAssignedToId,
                newValue: newAssignedToId,
              };
            }
          }
        }
        continue; // Skip the rest for assignedTo
      }

      // Check if this field was updated
      const column = event.metadata.findColumnWithPropertyName(field);
      if (!column) continue;

      const columnName = column.databaseName || column.propertyName;

      // Check if this column was in the updated columns
      const wasUpdated = event.updatedColumns.some(
        (col) => col.propertyName === field || col.databaseName === columnName,
      );

      if (wasUpdated) {
        const oldValue = event.databaseEntity?.[field];
        const newValue = event.entity?.[field];

        if (oldValue !== newValue) {
          // Handle Date objects
          if (oldValue instanceof Date && newValue instanceof Date) {
            if (oldValue.getTime() !== newValue.getTime()) {
              changes[field] = {
                oldValue: oldValue.toISOString(),
                newValue: newValue.toISOString(),
              };
            }
          } else {
            changes[field] = {
              oldValue: oldValue ?? null,
              newValue: newValue ?? null,
            };
          }
        }
      }
    }

    return changes;
  }

  /**
   * Get activity type based on changed fields
   */
  private getActivityType(
    changedFields: Record<string, { oldValue: any; newValue: any }>,
  ): string {
    if (changedFields.status) {
      return 'status_update';
    }
    if (changedFields.progress) {
      return 'progress_update';
    }
    if (changedFields.assignedTo) {
      return 'assignment_change';
    }
    if (changedFields.priority) {
      return 'priority_update';
    }
    if (changedFields.dueDate) {
      return 'due_date_update';
    }
    return 'task_update';
  }

  /**
   * Generate activity description based on changes
   */
  private generateActivityDescription(
    changedFields: Record<string, { oldValue: any; newValue: any }>,
    taskTitle: string,
  ): string {
    const descriptions: string[] = [];

    if (changedFields.status) {
      descriptions.push(
        `Status changed from "${changedFields.status.oldValue}" to "${changedFields.status.newValue}"`,
      );
    }
    if (changedFields.progress) {
      descriptions.push(
        `Progress updated from ${changedFields.progress.oldValue}% to ${changedFields.progress.newValue}%`,
      );
    }
    if (changedFields.assignedTo) {
      if (changedFields.assignedTo.newValue) {
        descriptions.push(`Task assigned to user`);
      } else {
        descriptions.push(`Task unassigned`);
      }
    }
    if (changedFields.priority) {
      descriptions.push(
        `Priority changed from "${changedFields.priority.oldValue}" to "${changedFields.priority.newValue}"`,
      );
    }
    if (changedFields.dueDate) {
      descriptions.push(`Due date updated`);
    }
    if (changedFields.title) {
      descriptions.push(
        `Title changed from "${changedFields.title.oldValue}" to "${changedFields.title.newValue}"`,
      );
    }
    if (changedFields.description) {
      descriptions.push(`Description updated`);
    }

    if (descriptions.length === 0) {
      return `Task "${taskTitle}" was updated`;
    }

    return descriptions.join(', ');
  }
}

