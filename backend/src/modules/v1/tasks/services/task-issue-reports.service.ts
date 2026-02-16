import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { TaskIssueReport } from '../entities/task-issue-report.entity';
import { Task } from '../entities/task.entity';
import {
  CreateTaskIssueReportDto,
  UpdateTaskIssueReportDto,
  TaskIssueReportDto,
} from '@shared/dtos';
import { plainToInstance } from 'class-transformer';
import { CrudService } from '@/common/crud/crud.service';
import { IMessageResponse } from '@shared/interfaces';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class TaskIssueReportsService extends CrudService<TaskIssueReport> {
  constructor(
    @InjectRepository(TaskIssueReport)
    private readonly taskIssueReportRepo: Repository<TaskIssueReport>,
    protected readonly entityRouterService: EntityRouterService,
    moduleRef: ModuleRef,
  ) {
    super(taskIssueReportRepo, moduleRef);
  }

  async addIssueReport(
    taskId: string,
    createIssueReportDto: CreateTaskIssueReportDto,
    currentUserId: string,
  ): Promise<IMessageResponse & { issueReport: TaskIssueReport }> {
    const taskRepo = this.entityRouterService.getRepository<Task>(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const repository = this.getRepository();
    const issueReport = repository.create({
      ...createIssueReportDto,
      task: { id: taskId } as Task,
      reportedBy: { id: currentUserId } as any,
      createdByUserId: currentUserId,
    });

    const savedIssueReport = await repository.save(issueReport);

    return { message: 'Issue report added successfully', issueReport: savedIssueReport };
  }

  async updateIssueReport(
    taskId: string,
    issueReportId: string,
    updateIssueReportDto: UpdateTaskIssueReportDto,
    currentUserId: string,
  ): Promise<IMessageResponse & { issueReport: TaskIssueReport }> {
    const repository = this.getRepository();
    const issueReport = await repository.findOne({
      where: { id: issueReportId, task: { id: taskId } as Task },
    });

    if (!issueReport) {
      throw new NotFoundException('Issue report not found');
    }

    Object.assign(issueReport, {
      ...updateIssueReportDto,
      updatedByUserId: currentUserId,
    });

    if (updateIssueReportDto.status === 'resolved' && !issueReport.resolvedAt) {
      issueReport.resolvedAt = new Date();
    }

    const updatedIssueReport = await repository.save(issueReport);

    return { message: 'Issue report updated successfully', issueReport: updatedIssueReport };
  }

  async deleteIssueReport(taskId: string, issueReportId: string): Promise<IMessageResponse> {
    const repository = this.getRepository();
    const issueReport = await repository.findOne({
      where: { id: issueReportId, task: { id: taskId } as Task },
    });

    if (!issueReport) {
      throw new NotFoundException('Issue report not found');
    }

    await repository.remove(issueReport);

    return { message: 'Issue report deleted successfully' };
  }

  async getTaskIssueReports(taskId: string): Promise<TaskIssueReport[]> {
    const repository = this.getRepository();
    return repository.find({
      where: { task: { id: taskId } as Task },
      relations: ['reportedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTaskIssueReport(taskId: string, issueReportId: string): Promise<TaskIssueReportDto> {
    const taskRepo = this.entityRouterService.getRepository<Task>(Task);
    const task = await taskRepo.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const repository = this.getRepository();
    const issueReport = await repository.findOne({
      where: { 
        id: issueReportId,
        task: { id: taskId } as Task,
      },
      relations: ['reportedBy'],
    });

    if (!issueReport) {
      throw new NotFoundException('Issue report not found');
    }

    return plainToInstance(TaskIssueReportDto, issueReport, {
      excludeExtraneousValues: false,
    });
  }
}

