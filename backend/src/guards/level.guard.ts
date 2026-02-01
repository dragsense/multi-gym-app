import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MIN_USER_LEVEL_METADATA } from '../decorators/level.decorator';
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

    const minLevel = this.reflector.getAllAndOverride<boolean>(
      MIN_USER_LEVEL_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (minLevel === undefined) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    return user?.level <= minLevel;
  }
}
