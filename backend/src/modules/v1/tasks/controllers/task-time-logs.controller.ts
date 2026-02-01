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

import { TaskTimeLogsService } from '../services/task-time-logs.service';
import {
  CreateTaskTimeLogDto,
  UpdateTaskTimeLogDto,
  TaskTimeLogDto,
} from '@shared/dtos';
import { TaskTimeLog } from '../entities/task-time-log.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Task Time Logs')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('tasks/:taskId/time-logs')
export class TaskTimeLogsController {
  constructor(private readonly taskTimeLogsService: TaskTimeLogsService) {}

  @ApiOperation({ summary: 'Get time logs for a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ status: 200, type: [TaskTimeLogDto] })
  @Get()
  getTimeLogs(@Param('taskId') taskId: string): Promise<TaskTimeLog[]> {
    return this.taskTimeLogsService.getTaskTimeLogs(taskId);
  }

  @ApiOperation({ summary: 'Get a single time log by ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiParam({ name: 'timeLogId', description: 'Time Log ID' })
  @ApiResponse({ status: 200, type: TaskTimeLogDto })
  @ApiResponse({ status: 404, description: 'Task or time log not found' })
  @Get(':timeLogId')
  getTimeLog(
    @Param('taskId') taskId: string,
    @Param('timeLogId') timeLogId: string,
  ): Promise<TaskTimeLogDto> {
    return this.taskTimeLogsService.getTaskTimeLog(taskId, timeLogId);
  }

  @ApiOperation({ summary: 'Add a time log to a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiBody({ type: CreateTaskTimeLogDto })
  @ApiResponse({ status: 201, description: 'Time log added successfully' })
  @Post()
  addTimeLog(
    @Param('taskId') taskId: string,
    @Body() createTimeLogDto: CreateTaskTimeLogDto,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse & { timeLog: TaskTimeLog }> {
    return this.taskTimeLogsService.addTimeLog(taskId, createTimeLogDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Update a time log' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiParam({ name: 'timeLogId', description: 'Time Log ID' })
  @ApiBody({ type: UpdateTaskTimeLogDto })
  @ApiResponse({ status: 200, description: 'Time log updated successfully' })
  @Patch(':timeLogId')
  updateTimeLog(
    @Param('taskId') taskId: string,
    @Param('timeLogId') timeLogId: string,
    @Body() updateTimeLogDto: UpdateTaskTimeLogDto,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse & { timeLog: TaskTimeLog }> {
    return this.taskTimeLogsService.updateTimeLog(taskId, timeLogId, updateTimeLogDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Delete a time log' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiParam({ name: 'timeLogId', description: 'Time Log ID' })
  @ApiResponse({ status: 200, description: 'Time log deleted successfully' })
  @Delete(':timeLogId')
  deleteTimeLog(
    @Param('taskId') taskId: string,
    @Param('timeLogId') timeLogId: string,
  ): Promise<IMessageResponse> {
    return this.taskTimeLogsService.deleteTimeLog(taskId, timeLogId);
  }
}

