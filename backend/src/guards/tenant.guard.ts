import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/decorators/access.decorator';
import { RequestContext } from '@/common/context/request-context';
import { EUserLevels } from '@shared/enums';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.level <= EUserLevels.SUPER_ADMIN) {
      return true;
    }

    // Check tenantId from multiple sources (same priority as EntityRouterService)
    const tenantId =
      (request as any).tenantId ||
      RequestContext.get<string>('tenantId');

    if (!tenantId) {
      throw new BadRequestException(
        'Tenant ID is required for this operation. Please provide a tenant context.',
      );
    }

    return true;
  }
}
