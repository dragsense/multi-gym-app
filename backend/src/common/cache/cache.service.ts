import { Injectable, Inject, Optional } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { CacheOptions } from './interface/cache.interface';

@Injectable()
export class CacheService {
  private readonly logger = new LoggerService(CacheService.name);
  private readonly cacheConfig: any;
  private readonly enabled: boolean;

  constructor(
    @Optional()
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache | null,
    private readonly configService: ConfigService,
  ) {
    this.cacheConfig = this.configService.get('cache');
    this.enabled = this.cacheConfig?.enabled ?? true;

    this.logger.log(`Cache configuration: ${JSON.stringify(this.cacheConfig)}`);
    this.logger.log(`Cache enabled: ${this.enabled}`);
    this.logger.log(`Cache manager available: ${!!this.cacheManager}`);

    if (!this.enabled) {
      this.logger.warn(
        '⚠️ Cache is disabled — all cache operations will be skipped',
      );
    }

    if (!this.cacheManager) {
      this.logger.error(
        '❌ Cache manager is NULL - Dragonfly connection failed!',
      );
      this.logger.error('Check if Dragonfly is running and accessible');
    }
  }

  private getPrefixedKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || this.cacheConfig?.prefix || 'app';
    return `${keyPrefix}:${key}`;
  }

  private getDefaultTTL(): number {
    return this.cacheConfig?.defaultTtl ?? 300;
  }

  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.enabled) {
      this.logger.warn('Cache is disabled, returning null');
      return null;
    }

    if (!this.cacheManager) {
      this.logger.error('Cache manager is null, cannot get value');
      return null;
    }

    const prefixedKey = this.getPrefixedKey(key, options?.prefix);
    try {
      const value = await this.cacheManager.get<T>(prefixedKey);
      this.logger.log(
        `Cache GET for ${prefixedKey}: ${value ? 'FOUND' : 'NOT FOUND'}`,
      );
      return value !== undefined && value !== null ? value : null;
    } catch (error) {
      this.logger.error(`Cache GET error for ${prefixedKey}`, error);
      return null;
    }
  }

  async set<T = any>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('Cache is disabled, cannot set value');
      return;
    }

    if (!this.cacheManager) {
      this.logger.error('Cache manager is null, cannot set value');
      return;
    }

    const prefixedKey = this.getPrefixedKey(key, options?.prefix);
    const ttl = options?.ttl ?? this.getDefaultTTL();
    try {
      await this.cacheManager.set(prefixedKey, value, ttl * 1000);
      this.logger.log(`Cache SET for ${prefixedKey} with TTL ${ttl}s`);
    } catch (error) {
      this.logger.error(`Cache SET error for ${prefixedKey}`, error);
    }
  }

  async del(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.enabled || !this.cacheManager) return false;

    const prefixedKey = this.getPrefixedKey(key, options?.prefix);
    try {
      await this.cacheManager.del(prefixedKey);
      return true;
    } catch (error) {
      this.logger.error(`Cache DELETE error for ${prefixedKey}`, error);
      return false;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.enabled) return false;
    const val = await this.get(key, options);
    return val !== null && val !== undefined;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<T> {
    if (!this.enabled) {
      this.logger.warn(
        'Cache is disabled, executing factory function directly',
      );
      return factory();
    }

    const cached = await this.get<T>(key, options);
    if (cached) {
      this.logger.log(`Cache HIT for key: ${key}`);
      return cached;
    }

    this.logger.log(`Cache MISS for key: ${key}, executing factory function`);
    const value = await factory();

    await this.set(key, value, options);
    this.logger.log(`Cache SET for key: ${key}`);
    return value;
  }
}
