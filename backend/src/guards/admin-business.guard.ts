import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/decorators/access.decorator';
import { SKIP_BUSINESS_CHECK_KEY } from '@/decorators/skip-business-check.decorator';
import { BusinessSubscriptionService } from '@/modules/v1/business/services/business-subscription.service';
import { ESubscriptionStatus } from '@shared/enums/business/subscription.enum';
import { RequestContext } from '@/common/context/request-context';
import { EUserLevels } from '@shared/enums/user.enum';

@Injectable()
export class AdminBusinessGuard implements CanActivate {
    constructor(
        private readonly businessSubscriptionService: BusinessSubscriptionService,
        private readonly reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const skipBusinessCheck = this.reflector.getAllAndOverride<boolean>(
            SKIP_BUSINESS_CHECK_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (skipBusinessCheck) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
    
        if (user.level <= EUserLevels.PLATFORM_OWNER) {
          return true;
        }

        const businessId =
            (request as any).businessId ||
            RequestContext.get<string>('businessId');


        try {
            let businessSubscription: { status: ESubscriptionStatus | null; activatedAt?: Date | null; subdomain?: string | null; } | null = null;
            if (user.level === EUserLevels.SUPER_ADMIN) {
                businessSubscription = await this.businessSubscriptionService.getUserBusinessSubscriptionStatus(user.id);
            } else {

                if (!businessId) {
                    throw new BadRequestException(
                        'Business ID is required for this operation. Please provide a business context.',
                    );
                }

                businessSubscription = await this.businessSubscriptionService.getBusinessSubscriptionStatusByBusinessId(businessId);
            }
            
            if (businessSubscription?.status === ESubscriptionStatus.ACTIVE) {
                return true;
            } else {
                throw new ForbiddenException('User must have an active business subscription to access this resource');
            }
        } catch (error) {
            throw new ForbiddenException('User must have an active business subscription to access this resource');
        }
    }
}
