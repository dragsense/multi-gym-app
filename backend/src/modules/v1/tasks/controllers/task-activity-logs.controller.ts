import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { TaskActivityLogService } from '../services/task-activity-log.service';
import { TaskActivityLogDto } from '@shared/dtos/task-dtos/task-activity-log.dto';
import { plainToInstance } from 'class-transformer';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Task Activity Logs')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('tasks/:taskId/activity-logs')
export class TaskActivityLogsController {
  constructor(
    private readonly taskActivityLogService: TaskActivityLogService,
  ) {}

  @ApiOperation({ summary: 'Get activity logs for a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ status: 200, type: [TaskActivityLogDto] })
  @Get()
  async getActivityLogs(
    @Param('taskId') taskId: string,
  ): Promise<TaskActivityLogDto[]> {
    const activityLogs = await this.taskActivityLogService.getTaskActivityLogs(
      taskId,
    );
    return activityLogs.map((log) =>
      plainToInstance(TaskActivityLogDto, log, {
        excludeExtraneousValues: false,
      }),
    );
  }
}

