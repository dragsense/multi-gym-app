import { INestApplication } from '@nestjs/common';
import { RequestContextMiddleware } from '../context/request-context.middleware';
import { SubdomainTenantMiddleware } from '../database/subdomain-tenant.middleware';

export function setupRequestContext(app: INestApplication) {
  // First, set up request context middleware (creates async local storage context)
  const requestContextMiddleware = app.get(RequestContextMiddleware);
  app.use(requestContextMiddleware.use.bind(requestContextMiddleware));

  // Then, set up subdomain tenant middleware (extracts subdomain and sets tenant context)
  // This must run after RequestContextMiddleware so it can use RequestContext
  try {
    const subdomainTenantMiddleware = app.get(SubdomainTenantMiddleware);
    app.use(subdomainTenantMiddleware.use.bind(subdomainTenantMiddleware));
  } catch (error) {
    // If middleware is not available (e.g., in tests), continue without it
    console.warn('SubdomainTenantMiddleware not available, continuing without subdomain routing');
  }
}
