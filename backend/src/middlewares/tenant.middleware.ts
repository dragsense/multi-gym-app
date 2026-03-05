import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../context/request-context';
import { LoggerService } from '@/common/logger/logger.service';

/**
 * Middleware to extract tenantId from multiple sources (body, headers, query)
 * and set tenant context based on the business
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
    private readonly logger = new LoggerService(TenantMiddleware.name);


    async use(req: Request, res: Response, next: NextFunction) {
        try {
            // Extract tenantId from multiple sources (priority: header > query > body)
            const tenantId = this.extractTenantId(req);

            if (!tenantId) {
                // No tenantId provided, continue without tenant context
                this.logger.debug('No tenantId provided in request');
                return next();
            }


            // Set tenant context in request object for easy access
            (req as any).tenantId = tenantId;

            // Set tenant context in RequestContext for async operations
            RequestContext.set('tenantId', tenantId);

            this.logger.debug(
                `Tenant context set: tenantId=${tenantId}`,
            );

            next();
        } catch (error) {
            this.logger.error(
                `Error setting tenant context: ${error.message}`,
                error.stack,
            );

            // If it's a BadRequestException, pass it through
            if (error instanceof BadRequestException) {
                throw error;
            }

            // For other errors, continue without tenant context
            next();
        }
    }

    /**
     * Extract tenantId from request (header, query, body, or cookies)
     * Priority: cookies > header > query > body
     */
    private extractTenantId(req: Request): string | null {


        // 4. Check cookies
        const cookies: any = (req as any).cookies;
        if (cookies && typeof cookies === 'object') {
            const cookieTenantId = cookies.tenant_id || cookies.tenantId;
            if (cookieTenantId) {
                return String(cookieTenantId);
            }
        }

        // 1. Check headers (x-tenant-id or tenant-id)
        const headerTenantId =
            req.headers['x-tenant-id'] ||
            req.headers['tenant-id'] ||
            req.headers['X-Tenant-Id'] ||
            req.headers['Tenant-Id'];

        if (headerTenantId) {
            return Array.isArray(headerTenantId) ? headerTenantId[0] : headerTenantId;
        }

        // 2. Check query parameters
        const queryTenantId = req.query.tenantId || req.query.tenant_id;
        if (queryTenantId) {
            if (Array.isArray(queryTenantId)) {
                const value = queryTenantId[0];
                return typeof value === 'string' ? value : null;
            }

            return typeof queryTenantId === 'string'
                ? queryTenantId
                : null;
        }



        // 3. Check request body
        if (req.body && typeof req.body === 'object') {
            const bodyTenantId = req.body.tenantId || req.body.tenant_id;
            if (bodyTenantId) {
                return String(bodyTenantId);
            }
        }



        return null;
    }
}
