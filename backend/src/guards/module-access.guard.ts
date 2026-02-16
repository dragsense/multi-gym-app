import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/decorators/access.decorator';
import { SKIP_MODULE_CHECK_KEY } from '@/decorators/skip-module-check.decorator';
import { REQUIRE_MODULE_KEY } from '@/decorators/require-module.decorator';
import { RequestContext } from '@/common/context/request-context';
import { BusinessSubscriptionService } from '@/modules/v1/business/services/business-subscription.service';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { EUserLevels } from '@shared/enums/user.enum';

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private readonly businessSubscriptionService: BusinessSubscriptionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Skip if explicitly marked to skip module check
    const skipModuleCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_MODULE_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipModuleCheck) {
      return true;
    }

    // Get required modules from decorator
    const requiredModules = this.reflector.getAllAndOverride<ESubscriptionFeatures[]>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no modules are required, allow access
    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Platform owners and super admins have access to all modules
    if (user.level === EUserLevels.PLATFORM_OWNER) {
      return true;
    }

    // Get businessId from request context (set by SubdomainTenantMiddleware)
    const businessId =
      (request as any).businessId ||
      RequestContext.get<string>('businessId');

    if (!businessId) {
      // No business context, check if user has a business
      // This handles cases where the request doesn't come from a subdomain
      throw new ForbiddenException(
        'Business context is required to access this resource. Please access via your business subdomain.',
      );
    }

    try {
      // Check if business has access to required modules
      const hasAccess = await this.businessSubscriptionService.hasModuleAccess(
        businessId,
        requiredModules,
      );

      if (!hasAccess) {
        const missingModules = await this.businessSubscriptionService.getMissingModules(
          businessId,
          requiredModules,
        );

        throw new ForbiddenException(
          `Your subscription does not include access to the following module(s): ${missingModules.join(', ')}. Please upgrade your subscription to access this feature.`,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException(
        'Unable to verify module access. Please ensure your business has an active subscription.',
      );
    }
  }
}
