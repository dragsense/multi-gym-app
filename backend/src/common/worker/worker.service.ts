import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { LoggerService } from '../logger/logger.service';
import { WorkerListDto, WorkerListPaginatedDto } from '@shared/dtos';
import { EWorkerStatus } from '@shared/enums';
import * as path from 'path';
import { IWorker } from '@shared/interfaces';

export interface WorkerTask {
  id: string;
  name: string;
  execute: (data: any) => Promise<any>;
}

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new LoggerService(WorkerService.name);
  private workers: Map<string, Worker> = new Map();
  private tasks: Map<string, WorkerTask> = new Map();
  private pausedWorkers: Set<string> = new Set();
  private isShuttingDown = false;

  constructor() {}

  async onModuleInit() {
    this.logger.log('🚀 Thread Worker Service initialized');
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    await this.shutdownAllWorkers();
    this.logger.log('✅ Thread Worker Service shutdown complete');
  }

  /**
   * Register a task that can be executed in threads
   */
  registerTask(task: WorkerTask): void {
    this.tasks.set(task.id, task);
    this.logger.log(`📝 Registered thread task: ${task.name}`);
  }

  /**
   * Execute task in a separate thread
   */
  async executeTask(taskId: string, data: any): Promise<any> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Check if worker is paused
    if (this.pausedWorkers.has(taskId)) {
      throw new Error(`Worker ${taskId} is paused`);
    }

    this.logger.log(`🔄 Executing task in thread: ${task.name}`);
    
    return new Promise((resolve, reject) => {
      const worker = new Worker(this.getWorkerPath(), {
        workerData: { taskId, data, taskCode: task.execute.toString() }
      });

      worker.on('message', (result) => {
        worker.terminate();
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result.data);
        }
      });

      worker.on('error', (error) => {
        this.logger.error(`❌ Thread worker error:`, error.stack);
        worker.terminate();
        reject(error);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  /**
   * Execute task in background thread
   */
  executeTaskBackground(taskId: string, data: any): void {
    this.executeTask(taskId, data).catch(error => {
      this.logger.error(`❌ Background thread task failed: ${taskId}`, error.stack);
    });
  }

  /**
   * Get worker file path
   */
  private getWorkerPath(): string {
    return path.join(__dirname, 'worker-thread.js');
  }

  /**
   * Pause a specific worker
   */
  async pauseWorker(taskId: string): Promise<boolean> {
    if (this.workers.has(taskId)) {
      this.pausedWorkers.add(taskId);
      this.logger.log(`⏸️ Paused worker for task: ${taskId}`);
      return true;
    }
    return false;
  }

  /**
   * Resume a specific worker
   */
  async resumeWorker(taskId: string): Promise<boolean> {
    if (this.workers.has(taskId) && this.pausedWorkers.has(taskId)) {
      this.pausedWorkers.delete(taskId);
      this.logger.log(`▶️ Resumed worker for task: ${taskId}`);
      return true;
    }
    return false;
  }

  /**
   * Pause all workers
   */
  async pauseAllWorkers(): Promise<void> {
    for (const taskId of this.workers.keys()) {
      this.pausedWorkers.add(taskId);
    }
    this.logger.log('⏸️ All workers paused');
  }

  /**
   * Resume all workers
   */
  async resumeAllWorkers(): Promise<void> {
    this.pausedWorkers.clear();
    this.logger.log('▶️ All workers resumed');
  }

  /**
   * Shutdown all workers
   */
  async shutdownAllWorkers(): Promise<void> {
    this.logger.log('🛑 Shutting down all thread workers...');
    
    for (const [taskId, worker] of this.workers) {
      await worker.terminate();
    }
    
    this.workers.clear();
    this.logger.log('✅ All thread workers shut down');
  }

  /**
   * Get all registered tasks
   */
  getTasks(): WorkerTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): WorkerTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Check if task exists
   */
  hasTask(taskId: string): boolean {
    return this.tasks.has(taskId);
  }

  /**
   * Get workers with pagination and filtering
   */
  async getWorkers(query: WorkerListDto): Promise<WorkerListPaginatedDto> {
    const { page = 1, limit = 10, status } = query;
    
    // Convert tasks to worker format
    let workers: IWorker[] = Array.from(this.tasks.values()).map(task => ({
      id: task.id,
      name: task.name,
      status: this.pausedWorkers.has(task.id) ? EWorkerStatus.PAUSED : EWorkerStatus.RUNNING,
      progress: Math.floor(Math.random() * 100), // Mock progress
      startTime: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      data: null,
    }));

    // Filter by status if provided
    if (status) {
      workers = workers.filter(worker => worker.status === status);
    }

    // Pagination
    const total = workers.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedWorkers = workers.slice(offset, offset + limit);

    return {
      data: paginatedWorkers,
      total,
      page,
      limit,
      lastPage: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
   
    };
  }

  /**
   * Get worker statistics
   */
  getWorkerStats(): any {
    return {
      totalTasks: this.tasks.size,
      activeWorkers: this.workers.size,
      tasks: Array.from(this.tasks.keys()),
    };
  }
}
