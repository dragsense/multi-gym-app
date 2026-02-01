import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA, CACHE_PREFIX_METADATA } from '../../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler());
    
    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const resolvedKey = this.resolveKey(cacheKey, request);
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler());
    const prefix = this.reflector.get<string>(CACHE_PREFIX_METADATA, context.getHandler());

    // Try to get from cache
    const cachedData = await this.cacheService.get(resolvedKey, { ttl, prefix });
    
    if (cachedData) {
      this.logger.debug(`Cache HIT for key: ${resolvedKey}`);
      return of(cachedData);
    }

    // If not in cache, execute the method and cache the result
    return next.handle().pipe(
      tap(async (data) => {
        if (data !== null && data !== undefined) {
          await this.cacheService.set(resolvedKey, data, { ttl, prefix });
          this.logger.debug(`Cache SET for key: ${resolvedKey}`);
        }
      }),
    );
  }

  private resolveKey(key: string, request: any): string {
    // Replace template variables in the key
    let resolvedKey = key;
    
    // Replace common template variables
    if (request.params) {
      Object.entries(request.params).forEach(([param, value]) => {
        resolvedKey = resolvedKey.replace(`{${param}}`, String(value));
      });
    }
    
    if (request.query) {
      Object.entries(request.query).forEach(([param, value]) => {
        resolvedKey = resolvedKey.replace(`{${param}}`, String(value));
      });
    }
    
    if (request.user) {
      Object.entries(request.user).forEach(([param, value]) => {
        resolvedKey = resolvedKey.replace(`{${param}}`, String(value));
      });
    }
    
    return resolvedKey;
  }
}
