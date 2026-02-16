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

import { TaskIssueReportsService } from '../services/task-issue-reports.service';
import {
  CreateTaskIssueReportDto,
  UpdateTaskIssueReportDto,
  TaskIssueReportDto,
} from '@shared/dtos';
import { TaskIssueReport } from '../entities/task-issue-report.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Task Issue Reports')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('tasks/:taskId/issue-reports')
export class TaskIssueReportsController {
  constructor(private readonly taskIssueReportsService: TaskIssueReportsService) {}

  @ApiOperation({ summary: 'Get issue reports for a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ status: 200, type: [TaskIssueReportDto] })
  @Get()
  getIssueReports(@Param('taskId') taskId: string): Promise<TaskIssueReport[]> {
    return this.taskIssueReportsService.getTaskIssueReports(taskId);
  }

  @ApiOperation({ summary: 'Get a single issue report by ID' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiParam({ name: 'issueReportId', description: 'Issue Report ID' })
  @ApiResponse({ status: 200, type: TaskIssueReportDto })
  @ApiResponse({ status: 404, description: 'Task or issue report not found' })
  @Get(':issueReportId')
  getIssueReport(
    @Param('taskId') taskId: string,
    @Param('issueReportId') issueReportId: string,
  ): Promise<TaskIssueReportDto> {
    return this.taskIssueReportsService.getTaskIssueReport(taskId, issueReportId);
  }

  @ApiOperation({ summary: 'Add an issue report to a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiBody({ type: CreateTaskIssueReportDto })
  @ApiResponse({ status: 201, description: 'Issue report added successfully' })
  @Post()
  addIssueReport(
    @Param('taskId') taskId: string,
    @Body() createIssueReportDto: CreateTaskIssueReportDto,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse & { issueReport: TaskIssueReport }> {
    return this.taskIssueReportsService.addIssueReport(taskId, createIssueReportDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Update an issue report' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiParam({ name: 'issueReportId', description: 'Issue Report ID' })
  @ApiBody({ type: UpdateTaskIssueReportDto })
  @ApiResponse({ status: 200, description: 'Issue report updated successfully' })
  @Patch(':issueReportId')
  updateIssueReport(
    @Param('taskId') taskId: string,
    @Param('issueReportId') issueReportId: string,
    @Body() updateIssueReportDto: UpdateTaskIssueReportDto,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse & { issueReport: TaskIssueReport }> {
    return this.taskIssueReportsService.updateIssueReport(taskId, issueReportId, updateIssueReportDto, currentUser.id);
  }

  @ApiOperation({ summary: 'Delete an issue report' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiParam({ name: 'issueReportId', description: 'Issue Report ID' })
  @ApiResponse({ status: 200, description: 'Issue report deleted successfully' })
  @Delete(':issueReportId')
  deleteIssueReport(
    @Param('taskId') taskId: string,
    @Param('issueReportId') issueReportId: string,
  ): Promise<IMessageResponse> {
    return this.taskIssueReportsService.deleteIssueReport(taskId, issueReportId);
  }
}

