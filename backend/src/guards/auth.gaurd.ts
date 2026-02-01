// src/auth/global-jwt.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtGuard } from './jwt.gaurd';
import { IS_PRIVATE_KEY, IS_PUBLIC_KEY } from '@/decorators/access.decorator';

@Injectable()
export class JwtAuthGuard extends JwtGuard {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
  ]);

    const isPrivate = this.reflector.getAllAndOverride<boolean>(
      IS_PRIVATE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPrivate) {
      return super.canActivate(context);
    }

    if (isPublic) {
      return true;
  }
 

    return super.canActivate(context);
  }
}
