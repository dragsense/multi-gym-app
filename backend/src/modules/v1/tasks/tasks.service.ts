import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets, LessThanOrEqual } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Task } from './entities/task.entity';
import { OverrideRecurrenceTask } from './entities/override-recurrence-task.entity';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskListDto,
  TaskCalendarEventsRequestDto,
  TaskDto,
} from '@shared/dtos';
import { plainToInstance } from 'class-transformer';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { IMessageResponse } from '@shared/interfaces';
import { UsersService } from '../users/users.service';
import { ETaskStatus } from '@shared/enums/task.enum';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { DateTime } from 'luxon';
import { RRule, Frequency, Options } from 'rrule';
import { EScheduleFrequency, EDayOfWeek } from '@shared/enums/schedule.enum';
import { LocationsService } from '../locations/services/locations.service';
import { DoorsService } from '../locations/doors/services/doors.service';

@Injectable()
export class TasksService extends CrudService<Task> {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly usersService: UsersService,
    private readonly locationsService: LocationsService,
    private readonly doorsService: DoorsService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['assignedTo.password', 'createdBy.password'],
      searchableFields: [
        'title',
        'description',
        'assignedTo.email',
        'assignedTo.profile.firstName',
        'assignedTo.profile.lastName',
        'createdBy.email',
        'createdBy.profile.firstName',
        'createdBy.profile.lastName',
      ],
    };
    super(taskRepo, moduleRef, crudOptions);
  }

  async createTask(
    createTaskDto: CreateTaskDto,
    currentUserId: string,
  ): Promise<IMessageResponse & { task: Task }> {
    // Validate assigned user if provided
    if (createTaskDto.assignedTo?.id) {
      const assignedUser = await this.usersService.getUser(
        createTaskDto.assignedTo.id,
      );
      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    // Validate location if provided
    if (createTaskDto.location?.id) {
      const location = await this.locationsService.getSingle(createTaskDto.location.id);
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    // Validate door if provided
    if (createTaskDto.door?.id) {
      const door = await this.doorsService.getSingle(createTaskDto.door.id);
      if (!door) {
        throw new NotFoundException('Door not found');
      }
      // Validate door belongs to location if location is also provided
      if (createTaskDto.location?.id && door.locationId !== createTaskDto.location.id) {
        throw new BadRequestException('Door does not belong to the specified location');
      }
    }

    // Use CRUD service create method
    // Notifications are handled by TaskEventListenerService via events
    const task = await this.create<CreateTaskDto>(
      {
        ...createTaskDto,
        assignedTo: createTaskDto.assignedTo?.id
          ? { id: createTaskDto.assignedTo.id } as any
          : undefined,
        ...(createTaskDto.location?.id ? {
          location: {
            id: createTaskDto.location.id,
          } as any,
        } : {}),
        ...(createTaskDto.door?.id ? {
          door: {
            id: createTaskDto.door.id,
          } as any,
        } : {}),
        status: createTaskDto.status || ETaskStatus.TODO,
        priority: createTaskDto.priority || 'medium' as any,
        progress: 0,
        startDateTime: new Date(createTaskDto.startDateTime),
        dueDate: new Date(createTaskDto.dueDate)

      } as CreateTaskDto,
    );

    return { message: 'Task created successfully.', task };
  }

  async updateTask(
    id: string,
    updateTaskDto: UpdateTaskDto,
    currentUserId: string,
  ): Promise<IMessageResponse & { task: Task }> {
    const idWithDateParts = id.split('@');
    const taskId = idWithDateParts[0];
    const date = idWithDateParts[1];

    // Prevent status and progress updates for calendar events
    if (date) {
      if (updateTaskDto.status !== undefined) {
        throw new BadRequestException(
          'Cannot update status for calendar events. Please cancel the task instead.',
        );
      }
      if (updateTaskDto.progress !== undefined) {
        throw new BadRequestException(
          'Cannot update progress for calendar events.',
        );
      }
    }

    const existingTask = await this.getSingle(taskId, {
      _relations: ['assignedTo', 'createdBy'],
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    // Validate assigned user if provided
    if (updateTaskDto.assignedTo?.id) {
      const assignedUser = await this.usersService.getUser(
        updateTaskDto.assignedTo.id,
      );
      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    // Validate location if provided
    if (updateTaskDto.location?.id) {
      const location = await this.locationsService.getSingle(updateTaskDto.location.id);
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    // Validate door if provided
    if (updateTaskDto.door?.id) {
      const door = await this.doorsService.getSingle(updateTaskDto.door.id);
      if (!door) {
        throw new NotFoundException('Door not found');
      }
      // Validate door belongs to location if location is also provided
      if (updateTaskDto.location?.id && door.locationId !== updateTaskDto.location.id) {
        throw new BadRequestException('Door does not belong to the specified location');
      }
    }

    // Track status changes for notifications
    const statusChanged =
      updateTaskDto.status && updateTaskDto.status !== existingTask.status;
    const assigneeChanged =
      updateTaskDto.assignedTo?.id &&
      updateTaskDto.assignedTo.id !== existingTask.assignedTo?.id;
    const previousAssigneeId = existingTask.assignedTo?.id;

    // Handle status transitions
    if (statusChanged) {
      await this.handleStatusTransition(
        existingTask,
        updateTaskDto.status as ETaskStatus,
      );
    }

    // If recurring task and date is provided, create/update override
    if (date && existingTask.enableRecurrence) {
      const dateDT = DateTime.fromISO(date);
      if (!dateDT.isValid) {
        throw new BadRequestException('Invalid date');
      }

      const overrideResult = await this.createOrUpdateOverride(existingTask, date, {
        ...updateTaskDto,
        enableRecurrence: undefined,
        recurrenceConfig: undefined,
        recurrenceEndDate: undefined,
      });

      // Return the existing task since override was created
      return {
        message: overrideResult.message,
        task: existingTask,
      };
    }

    // Update task
    // Notifications are handled by TaskEventListenerService via events
    const updatedTask = await this.update(
      taskId,
      {
        ...updateTaskDto,
        assignedTo: updateTaskDto.assignedTo?.id
          ? { id: updateTaskDto.assignedTo.id } as any
          : undefined,
        ...(updateTaskDto.location?.id ? {
          location: {
            id: updateTaskDto.location.id,
          } as any,
        } : {}),
        ...(updateTaskDto.door?.id ? {
          door: {
            id: updateTaskDto.door.id,
          } as any,
        } : {}),
        startDateTime: updateTaskDto.startDateTime
          ? new Date(updateTaskDto.startDateTime)
          : undefined,
        dueDate: updateTaskDto.dueDate
          ? new Date(updateTaskDto.dueDate)
          : undefined,
      } as UpdateTaskDto,
      {
        beforeUpdate: async () => {
          // Check and create actual tasks for recurring tasks when status is updated

          await this.checkActualTasksAndCreate(existingTask);

          return updateTaskDto;
        },
        afterUpdate: async () => {
          // Update all existing overrides with changed fields
          const overrideRepo = this.dataSource.getRepository(OverrideRecurrenceTask);
          const allOverrides = await overrideRepo.find({
            where: {
              task: { id: existingTask.id },
              isDeleted: false,
            },
            relations: ['task'],
          });

          for (const override of allOverrides) {
            const { updatedOverrideData, updatedOverride } =
              this.updateOverrideFields(override, updateTaskDto);

            override.overrideData = updatedOverrideData;
            Object.assign(override, updatedOverride);
            await overrideRepo.save(override);
          }
        },
      },
    );

    return {
      message: 'Task updated successfully',
      task: updatedTask,
    };
  }

  private async handleStatusTransition(
    task: Task,
    newStatus: ETaskStatus,
  ): Promise<void> {
    const now = new Date();
    const repository = this.getRepository();

    switch (newStatus) {
      case ETaskStatus.IN_PROGRESS:
        if (!task.startedAt) {
          await repository.update(task.id, { startedAt: now });
        }
        break;
      case ETaskStatus.DONE:
        await repository.update(task.id, {
          completedAt: now,
          progress: 100,
        });
        break;
      case ETaskStatus.CANCELLED:
        // Reset progress if cancelled
        await repository.update(task.id, { progress: 0 });
        break;
    }
  }

  async completeTask(
    id: string,
    currentUserId: string,
  ): Promise<IMessageResponse & { task: Task }> {
    // Prevent completing calendar events
    const idWithDateParts = id.split('@');
    if (idWithDateParts[1]) {
      throw new BadRequestException(
        'Cannot complete calendar events. Please cancel the task instead.',
      );
    }

    const task = await this.getSingle(id, {
      _relations: ['assignedTo', 'createdBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status === ETaskStatus.DONE) {
      throw new BadRequestException('Task is already completed');
    }

    return this.updateTask(
      id,
      {
        status: ETaskStatus.DONE,
        progress: 100,
      },
      currentUserId,
    );
  }

  async cancelTask(
    id: string,
    timezone: string,
    reason?: string,
  ): Promise<IMessageResponse> {
    const idWithDateParts = id.split('@');
    const taskId = idWithDateParts[0];
    const date = idWithDateParts[1];

    const existingTask = await this.getSingle(taskId, {
      _relations: ['assignedTo', 'createdBy'],
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    // Format the cancellation note with date and reason
    const now = DateTime.now().setZone(timezone);
    const formattedDate = now.toFormat('yyyy-MM-dd HH:mm');
    const cancellationNote = `\n\n--- Task Cancelled (${formattedDate}) ---\nReason: ${reason || 'No reason provided'}\n`;

    // If it's a recurring task and date is provided, create an override
    if (date && existingTask.enableRecurrence) {
      const taskDateTime = DateTime.fromISO(date);
      if (!taskDateTime.isValid) {
        throw new BadRequestException(
          'Invalid date for creating an individual task after cancellation.',
        );
      }

      // Create actual task if it's in the past, otherwise create override
      if (taskDateTime <= DateTime.now()) {
        // Create task with cancellation note in description
        const cancelledTask = await this.createRecurrenceSingleTask(
          existingTask,
          date,
          ETaskStatus.CANCELLED,
        );
        // Add cancellation note to the created task
        if (cancelledTask) {
          cancelledTask.description = (cancelledTask.description || '') + cancellationNote;
          const repository = this.getRepository();
          await repository.save(cancelledTask);
        }
      } else {
        // For future dates, create an override with cancelled status
        await this.createOrUpdateOverride(
          existingTask,
          date,
          {
            status: ETaskStatus.CANCELLED,
            description: (existingTask.description || '') + cancellationNote,
          },
        );
      }

      return {
        message: 'Task cancelled for this date.',
      };
    }

    // Check if task is already cancelled
    if (existingTask.status === ETaskStatus.CANCELLED) {
      throw new BadRequestException('Task is already cancelled');
    }

    // For non-recurring tasks, update the main task
    const updatedDescription = (existingTask.description || '') + cancellationNote;
    await this.update(taskId, {
      status: ETaskStatus.CANCELLED,
      description: updatedDescription,
    } as UpdateTaskDto);

    return { message: 'Task cancelled successfully' };
  }


  async getOverdueTasks(userId?: string): Promise<Task[]> {
    const query = this.taskRepo
      .createQueryBuilder('task')
      .where('task.dueDate < :now', { now: new Date() })
      .andWhere('task.status != :doneStatus', {
        doneStatus: ETaskStatus.DONE,
      })
      .andWhere('task.deletedAt IS NULL');

    if (userId) {
      query.andWhere('task.assignedToUserId = :userId', { userId });
    }

    return query
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('assignedTo.profile', 'assignedToProfile')
      .getMany();
  }

  async getCalendarEvents(
    requestDto: TaskCalendarEventsRequestDto,
    currentUser: User,
  ): Promise<TaskDto[]> {
    const isSuperAdmin =
      currentUser.level === (EUserLevels.SUPER_ADMIN as number);

    const { statuses, startDate, endDate } = requestDto;

    // Use CrudService getAll method
    const tasks = await this.getAll(
      {
        _relations: ['assignedTo', 'createdBy', 'overrides'],
      },
      TaskCalendarEventsRequestDto,
      {
        beforeQuery: (query: SelectQueryBuilder<Task>) => {
          if (!isSuperAdmin) {
            query.andWhere(
              new Brackets((qb) => {
                qb.where('entity.createdByUserId = :uid', {
                  uid: currentUser.id,
                }).orWhere('entity.assignedToUserId = :uid', {
                  uid: currentUser.id,
                });
              }),
            );
          }

          // Filter by date range (startDateTime) - similar to sessions
          query.andWhere(
            new Brackets((qb) => {
              qb.where('entity.startDateTime BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
              }).orWhere(
                `entity.enableRecurrence = true
                AND entity.recurrenceEndDate IS NOT NULL
                AND entity.recurrenceEndDate >= :startDate
                AND entity.startDateTime <= :endDate`,
                {
                  startDate,
                  endDate,
                },
              );
            }),
          );

          query.andWhere('entity.deletedAt IS NULL');

          return query;
        },
      },
    );

    const calendarEvents: TaskDto[] = [];

    for (const task of tasks) {
      const expandedTasks: TaskDto[] = await this.expandRecurringTask(
        task,
        startDate,
        endDate,
        statuses,
      );
      calendarEvents.push(...expandedTasks);
    }
    // Convert to TaskDto array
    return calendarEvents;
  }

  /**
   * Get a single calendar event for a specific date
   * Similar to getCalendarEvent in SessionsService
   */
  async getCalendarEvent(task: Task, date: string): Promise<TaskDto> {
    let startDateTime = DateTime.fromISO(date);

    const dueDays = task.dueDate ? DateTime.fromJSDate(task.dueDate).diff(DateTime.fromJSDate(task.startDateTime), 'days').days : 0;
    const dueDate = DateTime.fromISO(date).plus({ days: dueDays }).toJSDate();

    const taskObject: Partial<Task> = {
      ...task,
      startDateTime: new Date(date),
      dueDate: dueDate,
      id: `${task.id}@${date}`,
    };

    const overrideRepo = this.dataSource.getRepository(OverrideRecurrenceTask);
    let overrideTask: OverrideRecurrenceTask | null = await overrideRepo.findOne({
      where: {
        task: { id: task.id },
        date: new Date(date),
        isDeleted: false,
      },
      relations: ['assignedTo'],
    });

    if (overrideTask && overrideTask.startDateTime) {
      startDateTime = DateTime.fromJSDate(overrideTask.startDateTime);
      taskObject.startDateTime = startDateTime.toJSDate();
    }

    if (!overrideTask) {
      const latestOverride = await overrideRepo.find({
        where: {
          task: { id: task.id },
          date: LessThanOrEqual(DateTime.fromISO(date).endOf('day').toJSDate()),
          isDeleted: false,
        },
        relations: ['assignedTo'],
        order: { date: 'DESC' },
        take: 1,
      });
      overrideTask =
        latestOverride && latestOverride.length > 0 ? latestOverride[0] : null;
    }

    if (overrideTask) {
      const overrideData = overrideTask.overrideData;
      if (overrideData) {
        Object.assign(taskObject, overrideData);
      }
      if (overrideTask.assignedTo) {
        taskObject.assignedTo = overrideTask.assignedTo;
      }
      taskObject.status = overrideTask.status;
    }

    return plainToInstance(
      TaskDto,
      {
        ...taskObject,
        enableRecurrence: false,
        recurrenceConfig: task.recurrenceConfig,
        isCalendarEvent: true,
        originalTaskId: task.id,
        eventDate: date,
      },
      {
        excludeExtraneousValues: false,
      },
    );
  }

  /**
   * Check and create actual tasks for past dates when status is updated
   * Similar to checkActualSessionsAndCreate in SessionsService
   */
  async checkActualTasksAndCreate(existingTask: Task): Promise<void> {
    const now = new Date();
    const startDateTime = existingTask.startDateTime;

    if (startDateTime > now) {
      return;
    }

    try {
      // Get all expected tasks in the recurrence range
      const allTasks: TaskDto[] = await this.expandRecurringTask(
        existingTask,
        existingTask.startDateTime.toISOString(),
        now.toISOString(),
      );

      // Get all actual (created) tasks within that range
      const existingActualTasks: Task[] = await this.getAll(
        {},
        TaskListDto,
        {
          beforeQuery: (query: SelectQueryBuilder<Task>) => {
            query.andWhere('entity.parentId = :parentId', {
              parentId: existingTask.id,
            });

            query.andWhere('entity.startDateTime BETWEEN :start AND :end', {
              start: existingTask.startDateTime,
              end: now,
            });

            query.andWhere('entity.deletedAt IS NULL');

            return query;
          },
        },
      );

      const actualTaskDates = new Set(
        existingActualTasks.map((t) =>
          t.startDateTime instanceof Date
            ? t.startDateTime.toISOString()
            : new Date(t.startDateTime).toISOString(),
        ),
      );

      // For each missing date (in allTasks, not in actual), create actual task
      for (const task of allTasks) {
        const taskStartDateTime: string =
          typeof (task as any).startDateTime === 'string'
            ? (task as any).startDateTime
            : (task as any).startDateTime instanceof Date
              ? (task as any).startDateTime.toISOString()
              : '';
        if (taskStartDateTime && !actualTaskDates.has(taskStartDateTime)) {
          // Create actual task for missing date
          await this.createActualTask(
            `${existingTask.id}@${taskStartDateTime}`,
            existingTask.status,
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Create an actual task instance for a recurring task
   * Similar to createActualSession in SessionsService
   */
  async createActualTask(
    id: string,
    status: ETaskStatus,
  ): Promise<IMessageResponse> {
    const idWithDateParts = id.split('@');
    const taskId = idWithDateParts[0];
    const date = idWithDateParts[1];

    const existingTask = await this.getSingle(taskId, {
      _relations: ['assignedTo', 'createdBy'],
    });

    if (!existingTask) {
      throw new NotFoundException('Task not found');
    }

    if (date && existingTask.enableRecurrence) {
      const taskDateTime = DateTime.fromISO(date);
      if (!taskDateTime.isValid) {
        throw new BadRequestException(
          'Invalid date for creating an individual task instance.',
        );
      }

      if (taskDateTime > DateTime.now()) {
        throw new BadRequestException(
          'Cannot create an actual task for a future date',
        );
      }

      try {
        const existingActualTask = await this.getSingle(
          {
            parentId: existingTask.id,
            startDateTime: taskDateTime.toJSDate(),
          } as any,
          {
            _relations: ['assignedTo', 'createdBy'],
          },
        );

        if (existingActualTask) {
          return this.createActualTask(existingActualTask.id, status);
        }
      } catch (error) {
        console.log(error);
      }

      await this.createRecurrenceSingleTask(existingTask, date, status);

      return {
        message: 'Actual task created for this date.',
      };
    }

    if (existingTask.startDateTime > new Date()) {
      throw new BadRequestException(
        'Cannot create an actual task for a future date',
      );
    }

    return { message: 'Actual task created successfully' };
  }

  /**
   * Create a single task instance from recurrence
   * Similar to createRuccrenceSingleSession in SessionsService
   */
  async createRecurrenceSingleTask(
    existingTask: Task,
    targetDate: string,
    status?: ETaskStatus,
  ): Promise<Task> {
    const taskDateTime = DateTime.fromISO(targetDate);
    if (!taskDateTime.isValid) {
      throw new BadRequestException('Invalid target date');
    }

    // Check for override for this date
    const overrideRepo = this.dataSource.getRepository(OverrideRecurrenceTask);
    const overrideDate = taskDateTime.toJSDate();
    const deletedOverride = await overrideRepo.findOne({
      where: {
        task: { id: existingTask.id },
        date: overrideDate,
        isDeleted: true,
      },
    });

    if (deletedOverride) {
      throw new BadRequestException(
        `Task ${existingTask.id} already has a deleted override for date ${targetDate}`,
      );
    }

    const thisOccurrenceOverride = await overrideRepo.findOne({
      where: {
        task: { id: existingTask.id },
        date: overrideDate,
        isDeleted: false,
      },
      relations: ['task', 'assignedTo'],
    });

    const dueDays = existingTask.dueDate ? DateTime.fromJSDate(existingTask.dueDate).diff(DateTime.fromJSDate(existingTask.startDateTime), 'days').days : 0;
    const dueDate = DateTime.fromJSDate(taskDateTime.toJSDate()).plus({ days: dueDays }).toJSDate();

    const finalTaskData = {
      ...existingTask,
      dueDate: dueDate,
      ...(thisOccurrenceOverride?.overrideData || {}),
      ...(thisOccurrenceOverride?.assignedTo
        ? { assignedTo: { id: thisOccurrenceOverride.assignedTo.id } }
        : {
          assignedTo: existingTask.assignedTo
            ? { id: existingTask.assignedTo.id }
            : undefined,
        }),
      ...(status || thisOccurrenceOverride?.status
        ? { status: status || thisOccurrenceOverride?.status }
        : {}),
    };



    const task = await this.create(
      {
        ...finalTaskData,
        id: undefined,
        startDateTime: taskDateTime.toJSDate(),
        dueDate: dueDate,
        enableRecurrence: false,
        recurrenceConfig: undefined,
        recurrenceEndDate: undefined,
        parent: existingTask.id,
      },
      {
        afterCreate: async () => {
          // Mark override as completed if it exists
          if (thisOccurrenceOverride) {
            await overrideRepo.save({
              ...thisOccurrenceOverride,
              status: status || ETaskStatus.DONE,
            });
          }
        },
      },
    );

    return task;
  }

  /**
   * Create or update override for recurring task
   * Similar to createOrUpdateOverride in SessionsService but without scope
   */
  private async createOrUpdateOverride(
    existingTask: Task,
    date: string,
    updateTaskDto: UpdateTaskDto,
    isDeleted?: boolean,
  ): Promise<IMessageResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const overrideTaskDto: Partial<OverrideRecurrenceTask> = {};

      if (
        Object.keys(updateTaskDto).filter(
          (key) => updateTaskDto[key] !== undefined,
        ).length === 0
      ) {
        return { message: 'Task updated successfully' };
      }

      if (isDeleted !== undefined) {
        overrideTaskDto.isDeleted = isDeleted;
      }

      if (updateTaskDto.assignedTo?.id) {
        overrideTaskDto.assignedTo = {
          id: updateTaskDto.assignedTo.id,
        } as User;
      }

      const overrideData: OverrideRecurrenceTask['overrideData'] = {};
      if (updateTaskDto.title !== undefined)
        overrideData.title = updateTaskDto.title;
      if (updateTaskDto.description !== undefined)
        overrideData.description = updateTaskDto.description;
      if (updateTaskDto.priority !== undefined)
        overrideData.priority = updateTaskDto.priority;
      if (updateTaskDto.progress !== undefined)
        overrideData.progress = updateTaskDto.progress;
      if (updateTaskDto.tags !== undefined)
        overrideData.tags = updateTaskDto.tags;

      if (updateTaskDto.status !== undefined) {
        overrideTaskDto.status = updateTaskDto.status;
      }

      let startDateTime: DateTime;
      let targetDate: Date;

      if (updateTaskDto.startDateTime) {
        const startDateTimeStr = typeof updateTaskDto.startDateTime === 'string'
          ? updateTaskDto.startDateTime
          : new Date(updateTaskDto.startDateTime).toISOString();
        startDateTime = DateTime.fromISO(startDateTimeStr);
        overrideTaskDto.startDateTime = startDateTime.toJSDate();
        targetDate = startDateTime.toJSDate();
      } else {
        startDateTime = DateTime.fromISO(date);
        targetDate = startDateTime.toJSDate();
      }

      overrideTaskDto.date = targetDate;

      // Handle dueDate in overrideData
      if (updateTaskDto.dueDate) {
        overrideData.dueDate = typeof updateTaskDto.dueDate === 'string'
          ? updateTaskDto.dueDate
          : new Date(updateTaskDto.dueDate).toISOString();
      }

      const overrideRepo = queryRunner.manager.getRepository(
        OverrideRecurrenceTask,
      );

      // Check for existing override for this task and date
      const existingOverride = await overrideRepo.findOne({
        where: {
          task: { id: existingTask.id },
          date: targetDate,
          isDeleted: false,
        },
        relations: ['task', 'assignedTo'],
      });

      // Create or update the override
      if (existingOverride) {
        existingOverride.overrideData = {
          ...existingOverride.overrideData,
          ...overrideData,
        };



        await overrideRepo.save({
          ...existingOverride,
          ...overrideTaskDto,
        });
      } else {
        overrideTaskDto.overrideData = overrideData;
        overrideTaskDto.task = existingTask;
        overrideTaskDto.date = targetDate;

        if (!updateTaskDto.status) {
          overrideTaskDto.status = existingTask.status;
        }



        await overrideRepo.save(overrideTaskDto);
      }

      await queryRunner.commitTransaction();
      return { message: 'Task updated successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Error creating/updating override: ${errorMessage}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update override fields helper
   * Similar to updateOverrideFields in SessionsService
   */
  private updateOverrideFields(
    override: OverrideRecurrenceTask,
    updateTaskDto: UpdateTaskDto,
  ): {
    updatedOverrideData: OverrideRecurrenceTask['overrideData'];
    updatedOverride: Partial<OverrideRecurrenceTask>;
  } {
    const updatedOverrideData: OverrideRecurrenceTask['overrideData'] = {
      ...(override.overrideData || {}),
    };

    const updatedOverride: Partial<OverrideRecurrenceTask> = {};

    // Fields that can be overridden in overrideData
    const overrideableFields = [
      'title',
      'description',
      'priority',
      'progress',
      'tags',
    ];

    // For each overrideable field, check if it's in the update DTO
    for (const field of overrideableFields) {
      if (field in (override.overrideData || {})) {
        // Field was overridden
        if (
          !(field in updateTaskDto) ||
          (updateTaskDto as any)[field] === undefined
        ) {
          // Field is not in update DTO, set to undefined
          updatedOverrideData[field] = undefined;
        } else {
          // Field is in update DTO, update it
          updatedOverrideData[field] = (updateTaskDto as any)[field];
        }
      } else if (
        field in updateTaskDto &&
        (updateTaskDto as any)[field] !== undefined
      ) {
        // Field was not overridden but is in update DTO, add it
        updatedOverrideData[field] = (updateTaskDto as any)[field];
      }
    }

    // Handle dueDate in overrideData
    if (updateTaskDto.dueDate) {
      updatedOverrideData.dueDate = typeof updateTaskDto.dueDate === 'string'
        ? updateTaskDto.dueDate
        : new Date(updateTaskDto.dueDate).toISOString();
    }

    // Handle startDateTime separately (if changed)
    if (updateTaskDto.startDateTime) {
      updatedOverride.startDateTime = new Date(updateTaskDto.startDateTime);
    }

    // Handle assignedTo separately
    if (updateTaskDto.assignedTo?.id) {
      updatedOverride.assignedTo = {
        id: updateTaskDto.assignedTo.id,
      } as User;
    } else if (override.assignedTo && !updateTaskDto.assignedTo) {
      // assignedTo was overridden but not in update DTO, set to undefined
      updatedOverride.assignedTo = undefined;
    }

    return {
      updatedOverrideData,
      updatedOverride,
    };
  }

  /**
   * Expand recurring task into individual task instances for a date range
   * Similar to expandRecurringSession in SessionsService
   */
  private async expandRecurringTask(
    task: Task,
    rangeStart: string,
    rangeEnd: string,
    statuses?: ETaskStatus[],
  ): Promise<TaskDto[]> {
    // If not recurring, return the task as-is
    if (!task.enableRecurrence || !task.recurrenceConfig) {
      if (statuses && !statuses.includes(task.status)) return [];

      const taskDto = plainToInstance(TaskDto, task, {
        excludeExtraneousValues: false,
      });
      
      // Mark as calendar event if it's from calendar view
      (taskDto as any).isCalendarEvent = false;
      
      return [taskDto];
    }

    const dueDays = task.dueDate ? DateTime.fromJSDate(task.dueDate).diff(DateTime.fromJSDate(task.startDateTime), 'days').days : 0;

    const { frequency, weekDays, monthDays } = task.recurrenceConfig;
    const taskStart = new Date(task.startDateTime);
    const recurrenceEnd = task.recurrenceEndDate
      ? new Date(task.recurrenceEndDate)
      : null;
    const rangeStartDate = new Date(rangeStart);
    const rangeEndDate = new Date(rangeEnd);

    // Determine the actual end date (whichever comes first)
    const actualEndDate = recurrenceEnd
      ? recurrenceEnd <= rangeEndDate
        ? recurrenceEnd
        : rangeEndDate
      : rangeEndDate;

    // Map EScheduleFrequency to RRule Frequency
    const freqMap: Partial<Record<EScheduleFrequency, Frequency>> = {
      [EScheduleFrequency.DAILY]: Frequency.DAILY,
      [EScheduleFrequency.WEEKLY]: Frequency.WEEKLY,
      [EScheduleFrequency.MONTHLY]: Frequency.MONTHLY,
      [EScheduleFrequency.YEARLY]: Frequency.YEARLY,
    };

    const inclusiveEnd = new Date(actualEndDate);
    inclusiveEnd.setDate(inclusiveEnd.getDate() + 1);

    const rruleOptions: Partial<Options> = {
      dtstart: taskStart,
      until: inclusiveEnd,
      freq: freqMap[frequency] || Frequency.DAILY,
    };

    // Handle frequency-specific options
    if (
      frequency === EScheduleFrequency.WEEKLY &&
      weekDays &&
      weekDays.length > 0
    ) {
      const weekdayMap: Record<EDayOfWeek, typeof RRule.SU> = {
        [EDayOfWeek.SUNDAY]: RRule.SU,
        [EDayOfWeek.MONDAY]: RRule.MO,
        [EDayOfWeek.TUESDAY]: RRule.TU,
        [EDayOfWeek.WEDNESDAY]: RRule.WE,
        [EDayOfWeek.THURSDAY]: RRule.TH,
        [EDayOfWeek.FRIDAY]: RRule.FR,
        [EDayOfWeek.SATURDAY]: RRule.SA,
      };
      rruleOptions.byweekday = weekDays.map((day) => weekdayMap[day]);
    }

    if (
      frequency === EScheduleFrequency.MONTHLY &&
      monthDays &&
      monthDays.length > 0
    ) {
      rruleOptions.bymonthday = monthDays;
    }

    try {
      // Create RRule instance
      const rule = new RRule(rruleOptions);

      // Get all occurrences within the range
      const dates = rule.between(rangeStartDate, inclusiveEnd, true);

      // Create task instances for each date
      const expandedTasks: (TaskDto | undefined)[] = dates.map((date) => {
        const startDateTimeDT = DateTime.fromJSDate(date);
        const dueDate = DateTime.fromJSDate(date).plus({ days: dueDays }).toJSDate();
        const taskObject = {
          id: `${task.id}@${date.toISOString()}`,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          startDateTime: date,
          dueDate: dueDate,
          assignedTo: task.assignedTo,
          enableRecurrence: false,
        } as Partial<Task>;

        let thisOccurrenceOverride: OverrideRecurrenceTask | undefined = undefined;

        if (task.overrides && task.overrides.length > 0) {
          const childTask = task.overrides.filter((override) => {
            if (!override.date) {
              return false;
            }
            const childStartDateTime = DateTime.fromJSDate(override.date);
            return startDateTimeDT.hasSame(childStartDateTime, 'day');
          });

          if (childTask.length > 0) {
            thisOccurrenceOverride = childTask.find((override) => {
              return !override.isDeleted;
            });
          }
        }

        const activeOverride = thisOccurrenceOverride;

        if (activeOverride) {
          const overrideData = activeOverride.overrideData;

          if (overrideData) {
            taskObject.title = overrideData.title ?? task.title;
            taskObject.description = overrideData.description ?? task.description;
            taskObject.priority = overrideData.priority ?? task.priority;
            taskObject.progress = overrideData.progress ?? task.progress;
            taskObject.tags = overrideData.tags ?? task.tags;
            if (overrideData.dueDate) {
              taskObject.dueDate = new Date(overrideData.dueDate);
            }
          }

          if (activeOverride.startDateTime) {
            taskObject.startDateTime = activeOverride.startDateTime;
          }
          if (activeOverride.assignedTo) {
            taskObject.assignedTo = activeOverride.assignedTo;
          }
          taskObject.status = activeOverride.status;

          thisOccurrenceOverride = undefined;
        }

        const isActiveOverrideInvalid =
          activeOverride &&
          (activeOverride.isDeleted ||
            (statuses?.length && !statuses.includes(activeOverride.status)));

        const isTaskStatusInvalid =
          !activeOverride &&
          statuses?.length &&
          !statuses.includes(task.status);

        if (isActiveOverrideInvalid || isTaskStatusInvalid) return undefined;

        const taskDto = plainToInstance(TaskDto, taskObject, {
          excludeExtraneousValues: false,
        });
        
        // Add calendar event properties
        (taskDto as any).isCalendarEvent = true;
        (taskDto as any).originalTaskId = task.id;
        (taskDto as any).eventDate = date.toISOString();
        
        return taskDto;
      });

      return expandedTasks.filter((task) => task !== undefined) as TaskDto[];
    } catch (error) {
      // Fallback: return the original task if expansion fails
      return [
        plainToInstance(TaskDto, task, {
          excludeExtraneousValues: false,
        }),
      ];
    }
  }
}

