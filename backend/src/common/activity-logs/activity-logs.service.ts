import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { ActivityLog } from './entities/activity-log.entity';
import { CreateActivityLogDto } from './dtos/create-activity-log.dto';
import { CrudService } from '@/common/crud/crud.service';

@Injectable()
export class ActivityLogsService extends CrudService<ActivityLog> {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly configService: ConfigService,
    moduleRef: ModuleRef,
  ) {
    super(activityLogRepository, moduleRef);
  }

  /**
   * Check if activity should be logged based on configuration
   */
  shouldLogActivity(
    endpoint: string,
    method: string,
    activityType?: string,
  ): boolean {
    const config = this.configService.get('activityLogs');

    // If logging is disabled, don't log
    if (!config.enabled) {
      return false;
    }

    // Check if endpoint should be logged (if logEndpoints is empty, log all)
    if (config.logEndpoints.length > 0) {
      const shouldLogEndpoint = config.logEndpoints.some((logged) =>
        endpoint.includes(logged),
      );
      if (!shouldLogEndpoint) {
        return false;
      }
    } else {
      return false; // If logEndpoints is empty, don't log
    }

    // Check if method should be logged
    if (
      config.logMethods.length <= 0 ||
      !config.logMethods.includes(method.toUpperCase())
    ) {
      return false;
    }

    // Check activity type filtering
    if (activityType && config.logActivityTypes.length > 0) {
      const shouldLogType = config.logActivityTypes.includes(activityType);
      if (!shouldLogType) {
        return false;
      }
    }

    return true;
  }

  async createActivityLog(
    createActivityLogDto: CreateActivityLogDto,
  ): Promise<ActivityLog | null> {
    // Check if activity should be logged based on configuration
    const shouldLog = this.shouldLogActivity(
      createActivityLogDto.endpoint || '',
      createActivityLogDto.method || '',
      createActivityLogDto.type,
    );

    if (!shouldLog) {
      return null;
    }

    return await this.create(createActivityLogDto);
  }
}
