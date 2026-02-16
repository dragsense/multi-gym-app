import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';
export const CACHE_PREFIX_METADATA = 'cache_prefix';

/**
 * Cache decorator for methods
 * @param key Cache key (can include template variables like {userId}, {id})
 * @param ttl Time to live in seconds (optional)
 * @param prefix Cache prefix (optional)
 */
export const Cache = (key: string, ttl?: number, prefix?: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyName, descriptor);
    if (ttl) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyName, descriptor);
    }
    if (prefix) {
      SetMetadata(CACHE_PREFIX_METADATA, prefix)(target, propertyName, descriptor);
    }
  };
};

/**
 * Cache evict decorator for methods that should clear cache
 * @param keys Cache keys to evict (can include template variables)
 * @param prefix Cache prefix (optional)
 */
export const CacheEvict = (keys: string | string[], prefix?: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata('cache_evict', { keys, prefix })(target, propertyName, descriptor);
  };
};

/**
 * Cache put decorator for methods that should update cache
 * @param key Cache key (can include template variables)
 * @param ttl Time to live in seconds (optional)
 * @param prefix Cache prefix (optional)
 */
export const CachePut = (key: string, ttl?: number, prefix?: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata('cache_put', { key, ttl, prefix })(target, propertyName, descriptor);
  };
};
