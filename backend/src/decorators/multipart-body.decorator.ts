import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator for multipart/form-data routes.
 * Reads body from the request so that non-file fields populated by multer
 * are used for @Body()-style validation and transformation by ValidationPipe.
 * Use this instead of @Body() on routes that use FileInterceptor/FileFieldsInterceptor
 * when body fields may not be bound correctly.
 */
export const MultipartBody = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Record<string, unknown> => {
    const request = ctx.switchToHttp().getRequest();
    return (request.body ?? {}) as Record<string, unknown>;
  },
);
