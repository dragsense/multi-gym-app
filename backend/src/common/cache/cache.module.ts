import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';
import { getCacheConfig } from '../../config/cache.config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getCacheConfig,
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  controllers: [CacheController],
  exports: [CacheService],
})
export class CacheModule {}
