import {
  Injectable,
} from '@nestjs/common';
import { TaskActivityLog } from '../entities/task-activity-log.entity';
import { Task } from '../entities/task.entity';
import { User } from '@/common/base-user/entities/user.entity';
import { EntityRouterService } from '@/common/database/entity-router.service';

@Injectable()
export class TaskActivityLogService {
  constructor(
    private readonly entityRouterService: EntityRouterService,
  ) {}

  async createActivityLog(
    taskId: string,
    userId: string | null | undefined,
    activityType: string,
    description: string,
    changes?: Record<string, any>,
    updatedFields?: string[],
  ): Promise<TaskActivityLog> {
    const repository = this.entityRouterService.getRepository<TaskActivityLog>(TaskActivityLog);
    const activityLog = repository.create({
      task: { id: taskId } as Task,
      user: userId ? ({ id: userId } as User) : undefined,
      activityType,
      description,
      changes,
      updatedFields,
      createdByUserId: userId || undefined,
    });

    return await repository.save(activityLog);
  }

  async getTaskActivityLogs(taskId: string): Promise<TaskActivityLog[]> {
    const repository = this.entityRouterService.getRepository<TaskActivityLog>(TaskActivityLog);
    return repository.find({
      where: { task: { id: taskId } as Task },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}

