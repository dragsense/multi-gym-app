import { SetMetadata } from '@nestjs/common';
import { EResource } from '@shared/enums';

export const RESOURCE_KEY = 'resource';

/**
 * Decorator to specify the resource for permission checking
 * @param resource The resource enum value
 */
export const Resource = (resource: EResource) =>
  SetMetadata(RESOURCE_KEY, resource);
