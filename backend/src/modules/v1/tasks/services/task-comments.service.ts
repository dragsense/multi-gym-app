import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { TaskComment } from '../entities/task-comment.entity';
import { Task } from '../entities/task.entity';
import {
  CreateTaskCommentDto,
  UpdateTaskCommentDto,
  TaskCommentDto,
} from '@shared/dtos/task-dtos/task-comment.dto';
import { plainToInstance } from 'class-transformer';
import { CrudService } from '@/common/crud/crud.service';
import { IMessageResponse } from '@shared/interfaces';
import { TaskNotificationService } from './task-notification.service';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class TaskCommentsService extends CrudService<TaskComment> {
  constructor(
    @InjectRepository(TaskComment)
    private readonly taskCommentRepo: Repository<TaskComment>,
    protected readonly entityRouterService: EntityRouterService,
    private readonly taskNotificationService: TaskNotificationService,
    moduleRef: ModuleRef,
  ) {
    super(taskCommentRepo, moduleRef);
  }

  async addComment(
    taskId: string,
    createCommentDto: CreateTaskCommentDto,
    currentUserId: string,
  ): Promise<IMessageResponse & { comment: TaskCommentDto }> {
    const taskRepo = this.entityRouterService.getRepository<Task>(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const repository = this.getRepository();
    // Validate parent comment if provided
    if (createCommentDto.parentCommentId) {
      const parentComment = await repository.findOne({
        where: { id: createCommentDto.parentCommentId },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = repository.create({
      content: createCommentDto.content,
      task: { id: taskId } as Task,
      createdBy: { id: currentUserId } as any,
      createdByUserId: currentUserId,
      parentCommentId: createCommentDto.parentCommentId,
    });

    const savedComment = await repository.save(comment);

    // Reload comment with relations to ensure createdBy is loaded
    const commentWithRelations = await repository.findOne({
      where: { id: savedComment.id },
      relations: ['createdBy'],
    });

    if (!commentWithRelations) {
      throw new NotFoundException('Comment not found after creation');
    }

    // Send notification to task assignee and creator
    await this.taskNotificationService.notifyCommentAdded(
      task,
      commentWithRelations,
      currentUserId,
    );

    // Transform entity to DTO
    const commentDto = plainToInstance(TaskCommentDto, commentWithRelations, {
      excludeExtraneousValues: false,
    });

    return {
      message: 'Comment added successfully',
      comment: commentDto,
    };
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    const taskRepo = this.entityRouterService.getRepository<Task>(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const repository = this.getRepository();
    return repository.find({
      where: { task: { id: taskId } as Task },
      relations: ['createdBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async getTaskComment(taskId: string, commentId: string): Promise<TaskCommentDto> {
    const taskRepo = this.entityRouterService.getRepository<Task>(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const repository = this.getRepository();
    const comment = await repository.findOne({
      where: { 
        id: commentId,
        task: { id: taskId } as Task,
      },
      relations: ['createdBy'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return plainToInstance(TaskCommentDto, comment, {
      excludeExtraneousValues: false,
    });
  }

  async updateComment(
    taskId: string,
    commentId: string,
    updateCommentDto: UpdateTaskCommentDto,
    currentUserId: string,
  ): Promise<IMessageResponse & { comment: TaskCommentDto }> {
    const taskRepo = this.entityRouterService.getRepository<Task>(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const repository = this.getRepository();
    const comment = await repository.findOne({
      where: {
        id: commentId,
        task: { id: taskId } as Task,
      },
      relations: ['task', 'createdBy'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only allow the creator to update
    if (comment.createdByUserId !== currentUserId) {
      throw new NotFoundException('You can only update your own comments');
    }

    Object.assign(comment, updateCommentDto);
    comment.updatedByUserId = currentUserId;
    const updatedComment = await repository.save(comment);

    const commentDto = plainToInstance(TaskCommentDto, updatedComment, {
      excludeExtraneousValues: false,
    });

    return {
      message: 'Comment updated successfully',
      comment: commentDto,
    };
  }

  async deleteComment(
    commentId: string,
    currentUserId: string,
  ): Promise<IMessageResponse> {
    const repository = this.getRepository();
    const comment = await repository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only allow the creator to delete
    if (comment.createdByUserId !== currentUserId) {
      throw new NotFoundException('You can only delete your own comments');
    }

    await repository.remove(comment);

    return { message: 'Comment deleted successfully' };
  }
}

