import {
  Controller,
  Get,
  UseGuards,
  Body,
  Post,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskListDto,
  TaskPaginatedDto,
  TaskDto,
  SingleQueryDto,
  TaskCalendarEventsRequestDto,
} from '@shared/dtos';
import { Task } from './entities/task.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { Timezone } from '@/decorators/timezone.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { RequireModule } from '@/decorators/require-module.decorator';
import { NotFoundException } from '@nestjs/common';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Tasks')
@MinUserLevel(EUserLevels.ADMIN)
@RequireModule(ESubscriptionFeatures.TASKS)
@Resource(EResource.TASKS) 
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @ApiOperation({ summary: 'Get all tasks with pagination and filters' })
  @ApiResponse({ status: 200, type: TaskPaginatedDto })
  @Get()
  @MinUserLevel(EUserLevels.STAFF)
  findAll(@Query() query: TaskListDto, @AuthUser() currentUser: User) {

    const isAdmin = currentUser.level <= EUserLevels.ADMIN;

    return this.tasksService.get(query, TaskListDto, {
      beforeQuery: (query: any) => {
        if (!isAdmin) {
          query.andWhere('(entity.createdByUserId = :uid OR entity.assignedToUserId = :uid)', {
            uid: currentUser.id,
          });
        }

        return query;
      },
    });
  }

  @ApiOperation({ summary: 'Get overdue tasks' })
  @ApiResponse({ status: 200, type: [TaskDto] })
  @Get('overdue/all')
  getOverdueTasks(): Promise<Task[]> {
    return this.tasksService.getOverdueTasks();
  }

  @ApiOperation({ summary: 'Get overdue tasks for current user' })
  @ApiResponse({ status: 200, type: [TaskDto] })
  @Get('overdue/my')
  getMyOverdueTasks(
    @AuthUser() currentUser: User,
  ): Promise<Task[]> {
    return this.tasksService.getOverdueTasks(currentUser.id);
  }

  @ApiOperation({
    summary: 'Get all calendar events for tasks',
  })
  @ApiBody({
    type: TaskCalendarEventsRequestDto,
    description: 'Request calendar events for date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns array of calendar events',
    type: [TaskDto],
  })
  @Get('calendar/events')
  getCalendarEvents(
    @Query() request: TaskCalendarEventsRequestDto,
    @AuthUser() currentUser: User,
  ): Promise<TaskDto[]> {
    return this.tasksService.getCalendarEvents(request, currentUser);
  }

  @ApiOperation({ summary: 'Get a single task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID (can include date like taskId@date for calendar events)' })
  @ApiResponse({ status: 200, type: TaskDto })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Task>,
  ): Promise<Task | TaskDto> {
    const idWithDateParts = id.split('@');
    const taskId = idWithDateParts[0];
    const date = idWithDateParts[1];

    const task = await this.tasksService.getSingle(taskId, query);
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (!date) {
      return task;
    }

    return this.tasksService.getCalendarEvent(task, date);
  }

  @ApiOperation({ summary: 'Create a new task' })
  @ApiBody({
    type: CreateTaskDto,
    description: 'Create a new task',
  })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse & { task: Task }> {
    return this.tasksService.createTask(createTaskDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Update task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiBody({
    type: UpdateTaskDto,
    description: 'Update task information',
  })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse & { task: Task }> {
    return this.tasksService.updateTask(id, updateTaskDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Complete task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task completed successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Task is already completed' })
  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse & { task: Task }> {
    return this.tasksService.completeTask(id, currentUser.id);
  }

  @ApiOperation({ summary: 'Cancel a task' })
  @ApiParam({
    name: 'id',
    description: 'Task ID (with optional @date for recurring tasks)',
  })
  @ApiResponse({ status: 200, description: 'Task cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @Patch('cancel/:id')
  async cancelTask(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Timezone() timezone: string,
  ) {
    return this.tasksService.cancelTask(id, timezone, body?.reason);
  }

  @ApiOperation({ summary: 'Delete task by ID' })
  @ApiParam({
    name: 'id',
    description: 'Task ID',
  })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<IMessageResponse> {
    await this.tasksService.delete(id);
    return { message: 'Task deleted successfully' };
  }
}

