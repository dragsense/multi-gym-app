import { Controller, Post, Get, Param, Query } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerListDto, WorkerListPaginatedDto } from '@shared/dtos';

@Controller('worker')
export class WorkerController {
  constructor(
    private readonly workerService: WorkerService,
  ) {}

  /**
   * Get all workers with pagination
   */
  @Get()
  async getWorkers(@Query() query: WorkerListDto): Promise<WorkerListPaginatedDto> {
    return this.workerService.getWorkers(query);
  }

  /**
   * Pause all workers
   */
  @Post('pause-all')
  async pauseAll(): Promise<{ message: string }> {
    await this.workerService.pauseAllWorkers();
    return { message: 'All workers paused' };
  }

  /**
   * Resume all workers
   */
  @Post('resume-all')
  async resumeAll(): Promise<{ message: string }> {
    await this.workerService.resumeAllWorkers();
    return { message: 'All workers resumed' };
  }

  /**
   * Pause one worker by task ID
   */
  @Post('pause/:taskId')
  async pauseOne(@Param('taskId') taskId: string): Promise<{ message: string }> {
    const success = await this.workerService.pauseWorker(taskId);
    if (success) {
      return { message: `Worker ${taskId} paused` };
    } else {
      return { message: `Worker ${taskId} not found` };
    }
  }

  /**
   * Resume one worker by task ID
   */
  @Post('resume/:taskId')
  async resumeOne(@Param('taskId') taskId: string): Promise<{ message: string }> {
    const success = await this.workerService.resumeWorker(taskId);
    if (success) {
      return { message: `Worker ${taskId} resumed` };
    } else {
      return { message: `Worker ${taskId} not found` };
    }
  }
}
