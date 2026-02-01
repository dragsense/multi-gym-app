import { Injectable } from '@nestjs/common';
import { LoggerService } from '@/common/logger/logger.service';

@Injectable()
export class AppService {
  private readonly logger = new LoggerService(AppService.name);

  constructor() {}

  getAppInfo() {
    this.logger.log('Getting app info');

    return {
      name: 'Customer App Web API',
      description:
        'Empower coaches to manage clients, track progress, and deliver results — all in one simple, powerful tool.',
      version: '1.0.0',
      documentation: '/api/docs',
    };
  }
}
