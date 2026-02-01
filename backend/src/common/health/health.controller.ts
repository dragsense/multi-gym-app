import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { IHealthStatus } from '@shared/interfaces/health.interface';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';

@Controller('health')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Detailed health check endpoint
   */
  @Get()
  async getDetailedHealth(): Promise<IHealthStatus> {
    return this.healthService.getHealthStatus();
  }
}
