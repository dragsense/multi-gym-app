import { Injectable, ExecutionContext } from '@nestjs/common';
import { DatabaseManager, TenantContext } from './database-manager.service';
import { Repository } from 'typeorm';
import { RequestContext } from '../context/request-context';

/**
 * Transparent Entity Router - Automatically routes entities to correct database/schema
 * No need to manually specify which database to use
 */
@Injectable()
export class EntityRouterService {
  constructor(private readonly databaseManager: DatabaseManager) { }

  /**
   * Extract tenant context from request
   * Priority order:
   * 1. Subdomain-based tenant (from middleware)
   * 2. Request headers
   * 3. User object
   * 4. Request params
   */
  extractTenantContext(context: ExecutionContext): TenantContext | undefined {
    const request = context.switchToHttp().getRequest();

    // Priority 1: Subdomain-based tenant (set by SubdomainTenantMiddleware)
    const subdomainTenantId = (request as any).tenantId || RequestContext.get<string>('tenantId');

    // Priority 2: Request headers
    const headerTenantId =
      request.headers['x-tenant-id'] ||
      request.headers['tenant-id'];

    // Priority 3: User object
    const userTenantId =
      request.user?.tenantId ||
      request.user?.organizationId;

    // Priority 4: Request params
    const paramTenantId = request.params?.tenantId;

    // Use subdomain tenant first, then fallback to other sources
    const tenantId = subdomainTenantId || headerTenantId || userTenantId || paramTenantId;

    if (!tenantId) {
      return undefined;
    }

    return {
      tenantId: String(tenantId),
    };
  }

  /**
   * Get repository with automatic tenant routing
   */
  getRepository<T extends Record<string, any>>(entity: any, tenantId?: string): Repository<T> {
    const tenantIdToUse = tenantId || RequestContext.get<string>('tenantId');

    const context = { tenantId: tenantIdToUse };
    return this.databaseManager.getRepository<T>(entity, context);
  }

  /**
   * Get read-only repository (replica)
   */
  getReadOnlyRepository<T extends Record<string, any>>(entity: any, context?: TenantContext): Repository<T> {
    return this.databaseManager.getReadOnlyRepository<T>(entity, context);
  }

  /**
   * Get archive repository
   */
  getArchiveRepository<T extends Record<string, any>>(entity: any, context?: TenantContext): Repository<T> {
    return this.databaseManager.getArchiveRepository<T>(entity, context);
  }

  /**
   * Execute query with automatic routing
   */
  async executeQuery(query: string, parameters: any[] = [], context?: TenantContext) {
    return this.databaseManager.executeQuery(query, parameters, context);
  }

  /**
   * Create tenant resources when new tenant registers
   */
  async createTenantResources(tenantId: string): Promise<void> {
    return this.databaseManager.createTenantResources(tenantId);
  }

  /**
   * Check if tenant exists
   */
  async tenantExists(tenantId: string): Promise<boolean> {
    return this.databaseManager.tenantExists(tenantId);
  }

  /**
   * Get current database mode
   */
  getMode() {
    return this.databaseManager.getMode();
  }
}
