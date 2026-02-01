import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Cache')
@Controller('cache')
export class CacheController {
  constructor(private readonly configService: ConfigService) {}

  @Get('monitor-url')
  @ApiOperation({ summary: 'Get RedisInsight monitor URL for Dragonfly cache' })
  @ApiResponse({
    status: 200,
    description: 'Cache monitor URL retrieved successfully',
  })
  getCacheMonitorUrl() {
    const cacheConfig = this.configService.get('cache');
    const host = 'localhost';
    const redisInsightUrl = `http://${host}:8081`;

    return {
      url: redisInsightUrl,
      name: 'RedisInsight Monitor',
      description: 'Monitor Dragonfly cache via RedisInsight GUI',
      connectionInfo: {
        host: cacheConfig?.host || 'localhost',
        port: cacheConfig?.port || 6380,
        name: 'Dragonfly Cache',
      },
    };
  }
}
