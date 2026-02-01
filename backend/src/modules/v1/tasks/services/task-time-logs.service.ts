import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { TaskTimeLog } from '../entities/task-time-log.entity';
import { Task } from '../entities/task.entity';
import {
  CreateTaskTimeLogDto,
  UpdateTaskTimeLogDto,
  TaskTimeLogDto,
} from '@shared/dtos';
import { plainToInstance } from 'class-transformer';
import { CrudService } from '@/common/crud/crud.service';
import { IMessageResponse } from '@shared/interfaces';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class TaskTimeLogsService extends CrudService<TaskTimeLog> {
  constructor(
    @InjectRepository(TaskTimeLog)
    private readonly taskTimeLogRepo: Repository<TaskTimeLog>,
    protected readonly entityRouterService: EntityRouterService,
    moduleRef: ModuleRef,
  ) {
    super(taskTimeLogRepo, moduleRef);
  }

  async addTimeLog(
    taskId: string,
    createTimeLogDto: CreateTaskTimeLogDto,
    currentUserId: string,
  ): Promise<IMessageResponse & { timeLog: TaskTimeLog }> {
    const taskRepo = this.entityRouterService.getRepository<Task>(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const repository = this.getRepository();
    const timeLog = repository.create({
      ...createTimeLogDto,
      task: { id: taskId } as Task,
      user: { id: currentUserId } as any,
      startTime: new Date(createTimeLogDto.startTime),
      createdByUserId: currentUserId,
    });

    const savedTimeLog = await repository.save(timeLog);

    return { message: 'Time log added successfully', timeLog: savedTimeLog };
  }

  async updateTimeLog(
    taskId: string,
    timeLogId: string,
    updateTimeLogDto: UpdateTaskTimeLogDto,
    currentUserId: string,
  ): Promise<IMessageResponse & { timeLog: TaskTimeLog }> {
    const repository = this.getRepository();
    const timeLog = await repository.findOne({
      where: { id: timeLogId, task: { id: taskId } as Task },
    });

    if (!timeLog) {
      throw new NotFoundException('Time log not found');
    }

    Object.assign(timeLog, {
      ...updateTimeLogDto,
      startTime: updateTimeLogDto.startTime
        ? new Date(updateTimeLogDto.startTime)
        : timeLog.startTime,
      updatedByUserId: currentUserId,
    });

    const updatedTimeLog = await repository.save(timeLog);

    return { message: 'Time log updated successfully', timeLog: updatedTimeLog };
  }

  async deleteTimeLog(taskId: string, timeLogId: string): Promise<IMessageResponse> {
    const repository = this.getRepository();
    const timeLog = await repository.findOne({
      where: { id: timeLogId, task: { id: taskId } as Task },
    });

    if (!timeLog) {
      throw new NotFoundException('Time log not found');
    }

    await repository.remove(timeLog);

    return { message: 'Time log deleted successfully' };
  }

  async getTaskTimeLogs(taskId: string): Promise<TaskTimeLog[]> {
    const repository = this.getRepository();
    return repository.find({
      where: { task: { id: taskId } as Task },
      relations: ['user'],
      order: { startTime: 'DESC' },
    });
  }

  async getTaskTimeLog(taskId: string, timeLogId: string): Promise<TaskTimeLogDto> {
    const taskRepo = this.entityRouterService.getRepository<Task>(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const repository = this.getRepository();
    const timeLog = await repository.findOne({
      where: { 
        id: timeLogId,
        task: { id: taskId } as Task,
      },
      relations: ['user'],
    });

    if (!timeLog) {
      throw new NotFoundException('Time log not found');
    }

    return plainToInstance(TaskTimeLogDto, timeLog, {
      excludeExtraneousValues: false,
    });
  }
}

