import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { create } from 'cache-manager-ioredis';

export default registerAs('cache', () => ({
  host: process.env.CACHE_HOST || 'localhost',
  port: parseInt(process.env.CACHE_PORT || '6379', 10),
  password: process.env.CACHE_PASSWORD || undefined,
  db: parseInt(process.env.CACHE_DB || '0', 10),
  defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10), // seconds
  maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
  prefix: process.env.CACHE_PREFIX || 'app',
  enabled: process.env.CACHE_ENABLED === 'true',
}));

export const getCacheConfig = async (configService: ConfigService) => {
  const cacheConfig = configService.get('cache');

  if (!cacheConfig.enabled) {
    console.warn('[Cache] Disabled via environment variable');
    return {};
  }

  // ✅ When using Dragonfly (Redis-compatible)
  const store = await create({
    host: cacheConfig.host,
    port: cacheConfig.port,
    password: cacheConfig.password,
    db: cacheConfig.db,
    ttl: cacheConfig.defaultTtl,
    keyPrefix: `${cacheConfig.prefix}:`,
    maxRetriesPerRequest: 5,
    connectTimeout: 5000,
    enableReadyCheck: true,
  });

  return { store };
};
