import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformOwnerDashboardService } from '../services/platform-owner-dashboard.service';
import { PlatformOwnerDashboardDto } from '@shared/dtos';
import { IPlatformOwnerDashboardStats } from '@shared/interfaces/platform-owner-dashboard.interface';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Platform Owner Dashboard')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
@Controller('platform-owner/dashboard')
export class PlatformOwnerDashboardController {
  constructor(
    private readonly platformOwnerDashboardService: PlatformOwnerDashboardService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform owner dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Platform owner dashboard statistics retrieved successfully',
  })
  async getDashboardStats(
    @Query() query: PlatformOwnerDashboardDto,
  ): Promise<IPlatformOwnerDashboardStats> {
    return this.platformOwnerDashboardService.getDashboardStats(query);
  }
}
