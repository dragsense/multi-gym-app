import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extract timezone from request headers
 * Defaults to 'UTC' if not provided
 */
export const Timezone = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const timezone = request.headers['x-timezone'];
    
    return timezone || 'UTC';
  },
);

