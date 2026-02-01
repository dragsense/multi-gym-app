import { Injectable } from '@nestjs/common';
import * as https from 'https';

import { ConfigService } from '@nestjs/config';
import { EntityRouterService } from '../database/entity-router.service';
import { DatabaseManager } from '../database/database-manager.service';
import {
  IDatabaseHealth,
  IMemoryHealth,
  INetworkHealth,
  IHealthStatus,
} from '@shared/interfaces/health.interface';
import { EHealthStatus } from '@shared/enums';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class HealthService {
  private readonly logger = new LoggerService(HealthService.name);
  private readonly startTime: Date = new Date();

  constructor(
    private readonly configService: ConfigService,
    private readonly entityRouter: EntityRouterService,
    private readonly databaseManager: DatabaseManager,
  ) { }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<IHealthStatus> {
    this.logger.log('Performing comprehensive health check...');

    const [databaseHealth, memoryHealth, networkHealth] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkMemoryHealth(),
      this.checkNetworkHealth(),
    ]);

    const overallStatus = this.determineOverallStatus([
      databaseHealth.status,
      memoryHealth.status,
      networkHealth.status,
    ]);

    return {
      status: overallStatus,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime.getTime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: databaseHealth,
        memory: memoryHealth,
        network: networkHealth,
      },
    };
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<IDatabaseHealth> {
    try {
      const startTime = Date.now();

      // Test main connection
      await this.entityRouter.executeQuery('SELECT 1');
      const responseTime = Date.now() - startTime;

      // Get total count of all connections
      const allConnections = this.databaseManager.getAllConnections();
      const connectionsCount = allConnections.size;

      return {
        status: EHealthStatus.HEALTHY,
        mode: this.entityRouter.getMode(),
        responseTime,
        lastChecked: new Date(),
        connectionsCount,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Database health check failed: ${errorMessage}`);
      
      // Still try to get connection count even if health check failed
      const allConnections = this.databaseManager.getAllConnections();
      const connectionsCount = allConnections.size;

      return {
        status: EHealthStatus.UNHEALTHY,
        mode: 'unknown',
        responseTime: 0,
        lastChecked: new Date(),
        connectionsCount,
      };
    }
  }

  /**
   * Check memory health
   */
  private checkMemoryHealth(): Promise<IMemoryHealth> {
    try {
      const memUsage = process.memoryUsage();
      const total = memUsage.heapTotal;
      const used = memUsage.heapUsed;
      const free = total - used;
      const percentage = (used / total) * 100;

      let status = EHealthStatus.HEALTHY;

      if (percentage > 90) {
        status = EHealthStatus.UNHEALTHY;
      } else if (percentage > 75) {
        status = EHealthStatus.DEGRADED;
      }

      return Promise.resolve({
        status,
        used,
        total,
        percentage: Math.round(percentage * 100) / 100,
        free,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Memory health check failed: ${errorMessage}`);
      return Promise.resolve({
        status: EHealthStatus.UNHEALTHY,
        used: 0,
        total: 0,
        percentage: 0,
        free: 0,
      });
    }
  }

  private async checkNetworkHealth(): Promise<INetworkHealth> {
    try {
      const startTime = Date.now();
      const pingUrl =
        this.configService.get<string>('health.pingUrl') ||
        'https://www.google.com';

      // Make HTTPS request to check network connectivity
      await this.pingUrl(pingUrl);
      const latency = Date.now() - startTime;

      let status = EHealthStatus.HEALTHY;
      if (latency > 2000) status = EHealthStatus.UNHEALTHY;
      else if (latency > 500) status = EHealthStatus.DEGRADED;

      return {
        status,
        latency,
        throughput: 0, // could later measure upload/download speed
        connections: 1,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Network health check failed: ${errorMessage}`);
      return {
        status: EHealthStatus.UNHEALTHY,
        latency: 0,
        throughput: 0,
        connections: 0,
      };
    }
  }

  /**
   * Ping a URL via HTTPS
   */
  private pingUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        response.on('data', () => { });
        response.on('end', () => {
          resolve();
        });
      });

      request.on('error', (error) => {
        reject(new Error(error?.message || 'Unknown error'));
      });

      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Determine overall status
   */
  private determineOverallStatus(statuses: EHealthStatus[]): EHealthStatus {
    if (statuses.includes(EHealthStatus.UNHEALTHY)) {
      return EHealthStatus.UNHEALTHY;
    }
    if (statuses.includes(EHealthStatus.DEGRADED)) {
      return EHealthStatus.DEGRADED;
    }
    return EHealthStatus.HEALTHY;
  }
}
