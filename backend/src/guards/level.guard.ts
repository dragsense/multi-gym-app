import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MIN_USER_LEVEL_METADATA, REQUIRE_USER_LEVELS_METADATA } from '../decorators/level.decorator';
import { IS_PUBLIC_KEY } from '@/decorators/access.decorator';

@Injectable()
export class UserLevelGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Check for array of required levels first
    const requiredLevels = this.reflector.getAllAndOverride<number[]>(
      REQUIRE_USER_LEVELS_METADATA,
      [context.getHandler(), context.getClass()],
    );

    // Check for minimum level (backward compatibility)
    const minLevel = this.reflector.getAllAndOverride<number>(
      MIN_USER_LEVEL_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (minLevel === undefined && requiredLevels === undefined) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    return user.level <= (minLevel ?? 0) || requiredLevels?.includes(user.level);
  }
}
