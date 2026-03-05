import { INestApplication } from '@nestjs/common';
import { SubdomainTenantMiddleware, TenantMiddleware, RequestContextMiddleware } from '@/middlewares';
import { APP_MODE } from '@/config/app.config';

export function setupMiddleware(app: INestApplication) {
  // First, set up request context middleware (creates async local storage context)
  const requestContextMiddleware = app.get(RequestContextMiddleware);
  app.use(requestContextMiddleware.use.bind(requestContextMiddleware));

  if (process.env.APP_MODE === APP_MODE.MULTI_DOMAIN_TENANT) {
    const subdomainTenantMiddleware = app.get(SubdomainTenantMiddleware);
    app.use(subdomainTenantMiddleware.use.bind(subdomainTenantMiddleware));
  } else if (process.env.APP_MODE === APP_MODE.SINGLE_DOMAIN_TENANT) {
    const tenantMiddleware = app.get(TenantMiddleware);
    app.use(tenantMiddleware.use.bind(tenantMiddleware));
  }



}
