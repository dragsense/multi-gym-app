import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/decorators/access.decorator';
import { RequestContext } from '@/context/request-context';
import { APP_MODE } from '@/config/app.config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '@/modules/v1/business/entities/business.entity';
import { LoggerService } from '@/common/logger/logger.service';


@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new LoggerService(TenantGuard.name);

  constructor(private readonly reflector: Reflector,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) { }


  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip if route is public

    const request = context.switchToHttp().getRequest();

    // Check tenantId from multiple sources (same priority as EntityRouterService)
    if (process.env.APP_MODE === APP_MODE.MULTI_DOMAIN_TENANT || process.env.APP_MODE === APP_MODE.SINGLE_DOMAIN_TENANT) {

      let business: Business | null = null;

      const subdomain =
        (request as any).subdomain ||
        RequestContext.get<string>('subdomain');

      const tenantId =
        (request as any).tenantId ||
        RequestContext.get<string>('tenantId');

      // Look up business by subdomain
      if (subdomain || tenantId) {
        business =
          tenantId
            ? await this.businessRepository.findOne({
              where: { tenantId },
              select: ['id', 'tenantId', 'subdomain'],
            }) : subdomain
              ? await this.businessRepository.findOne({
                where: { subdomain: subdomain.toLowerCase() },
                select: ['id', 'tenantId', 'subdomain'],
              })
              : null;

        if (!business) {
          this.logger.warn(`Business not found for ${subdomain || tenantId}`);
          throw new BadRequestException(`Business not found for ${subdomain || tenantId}`);
        }
      }


      if (!business || !business.tenantId) {
        return true;
      }

      // Set tenant context in request object for easy access
      (request as any).businessId = business.id;
      (request as any).tenantId = business.tenantId;

      // Set tenant context in RequestContext for async operations
      RequestContext.set('businessId', business.id);
      RequestContext.set('tenantId', business.tenantId);

      this.logger.debug(
        `Business context set: businessId=${business.id}, tenantId=${business.tenantId}`,
      );
    }

    return true;
  }
}
