import {
  Controller,
  Get,
  UseGuards,
  Body,
  Post,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { TaskCommentsService } from '../services/task-comments.service';
import {
  CreateTaskCommentDto,
  UpdateTaskCommentDto,
  TaskCommentDto,
} from '@shared/dtos/task-dtos/task-comment.dto';
import { TaskComment } from '../entities/task-comment.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Task Comments')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('tasks/:taskId/comments')
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}

  @ApiOperation({ summary: 'Get comments for a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ status: 200, type: [TaskCommentDto] })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Get()
  getComments(@Param('taskId') taskId: string) {
    return this.taskCommentsService.getTaskComments(taskId);
  }

  @ApiOperation({ summary: 'Get a single comment by ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, type: TaskCommentDto })
  @ApiResponse({ status: 404, description: 'Task or comment not found' })
  @Get(':commentId')
  getComment(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
  ): Promise<TaskCommentDto> {
    return this.taskCommentsService.getTaskComment(taskId, commentId);
  }

  @ApiOperation({ summary: 'Add a comment to a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiBody({
    type: CreateTaskCommentDto,
    description: 'Add a comment to the task',
  })
  @ApiResponse({ status: 201, description: 'Comment added successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Post()
  addComment(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateTaskCommentDto,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse & { comment: TaskCommentDto }> {
    return this.taskCommentsService.addComment(taskId, createCommentDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiBody({ type: UpdateTaskCommentDto })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @Patch(':commentId')
  updateComment(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateTaskCommentDto,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse & { comment: TaskCommentDto }> {
    return this.taskCommentsService.updateComment(taskId, commentId, updateCommentDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @Delete(':commentId')
  deleteComment(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse> {
    return this.taskCommentsService.deleteComment(commentId, currentUser.id);
  }
}

