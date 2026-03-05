import { Repository, ObjectLiteral, EntityManager } from 'typeorm';
import { IPaginatedResponse } from '@shared/interfaces';

export interface CrudOptions {
  searchableFields?: string[]; // Fields that can be searched (legacy support)
  defaultSearchableFields?: string[];
  defaultSort?: { field: string; order: 'ASC' | 'DESC' };
  pagination?: {
    defaultLimit: number;
    maxLimit: number;
  };
  restrictedFields?: string[];
  selectableFields?: string[];
  /**
   * When true, automatically scope queries by tenantId (if present in RequestContext)
   * ONLY applies in DB_MODE=single and only if the entity has a tenantId column.
   *
   * Default: true
   */
  tenantScoped?: boolean;

  /**
   * When true and current user is SUPER_ADMIN, automatically scope queries to
   * only return rows created by that user (createdByUserId = RequestContext.userId),
   * but only if the entity has a createdByUserId column.
   *
   * Default: true
   */
  superAdminOwnDataOnly?: boolean;
}

export interface CrudMethodConfig {
  /**
   * Include soft-deleted rows (i.e. do NOT apply `deletedAt IS NULL`).
   *
   * Default: false
   */
  includeDeleted?: boolean;

  /**
   * Skip tenant scoping even if enabled at service level.
   *
   * Default: false
   */
  skipTenantScope?: boolean;

  /**
   * Skip SUPER_ADMIN "own data only" scoping even if enabled at service level.
   *
   * Default: false
   */
  skipSuperAdminOwnDataOnly?: boolean;

  /**
   * Allow null values to be used as filters (generates `IS NULL` clauses).
   *
   * Default: false
   */
  includeNullFilters?: boolean;

  /**
   * Override tenantId used for scoping (undefined = use RequestContext).
   * - `null` disables tenant scoping for this call.
   */
  tenantId?: string | null;
}

export interface ICrudService<T extends ObjectLiteral> {
  /**
   * Create a new entity
   */
  create<TCreateDto>(
    createDto: TCreateDto,
    callbacks?: {
      beforeCreate?: (
        processedData: TCreateDto,
        manager: EntityManager,
      ) => any | Promise<any>;
      afterCreate?: (result: any, manager: EntityManager) => any | Promise<any>;
    },
    config?: CrudMethodConfig,
  ): Promise<T>;

  /**
   * Update an existing entity
   */
  update<TUpdateDto>(
    key: string | number | Record<string, any>,
    updateDto: TUpdateDto,
    callbacks?: {
      beforeUpdate?: (
        processedData: TUpdateDto,
        existingEntity: T,
        manager: EntityManager,
      ) => any | Promise<any>;
      afterUpdate?: (
        updatedEntity: T,
        manager: EntityManager,
      ) => any | Promise<any>;
    },
    config?: CrudMethodConfig,
  ): Promise<T>;

  /**
   * Get entities with pagination
   */
  get<TQueryDto>(
    queryDto: TQueryDto,
    dtoClass?: any,
    callbacks?: {
      beforeQuery?: (query: any, queryDto: any) => any | Promise<any>;
    },
    config?: CrudMethodConfig,
  ): Promise<IPaginatedResponse<T>>;

  /**
   * Get all entities without pagination
   */
  getAll<TQueryDto>(
    queryDto: TQueryDto,
    dtoClass: any,
    callbacks?: {
      beforeQuery?: (query: any) => any | Promise<any>;
    },
    config?: CrudMethodConfig,
  ): Promise<T[]>;

  /**
   * Get a single entity by any key
   */
  getSingle<TQueryDto>(
    key: string | number | Record<string, any>,
    queryDto?: TQueryDto,
    dtoClass?: any,
    callbacks?: {
      beforeQuery?: (query: any, queryDto: any) => any | Promise<any>;
    },
    config?: CrudMethodConfig,
  ): Promise<T | null>;

  /**
   * Delete an entity by ID and return the deleted entity
   */
  delete(
    key: string | number | Record<string, any>,
    callbacks?: {
      beforeDelete?: (
        entity: any,
        manager: EntityManager,
      ) => any | Promise<any>;
      afterDelete?: (entity: any, manager: EntityManager) => any | Promise<any>;
    },
    config?: CrudMethodConfig,
  ): Promise<T>;

  /**
   * Restore an entity by ID and return the restored entity
   */
  restore(
    key: string | number | Record<string, any>,
    callbacks?: {
      beforeRestore?: (
        entity: any,
        manager: EntityManager,
      ) => any | Promise<any>;
      afterRestore?: (
        entity: any,
        manager: EntityManager,
      ) => any | Promise<any>;
    },
    config?: CrudMethodConfig,
  ): Promise<T>;

  /**
   * Permanently delete an entity by ID and return the deleted entity
   */
  permanentlyDelete(
    key: string | number | Record<string, any>,
    callbacks?: {
      beforeDelete?: (
        entity: any,
        manager: EntityManager,
      ) => any | Promise<any>;
      afterDelete?: (entity: any, manager: EntityManager) => any | Promise<any>;
    },
    config?: CrudMethodConfig,
  ): Promise<void>;

  /**
   * Get repository for the entity
   */
  getRepository(): Repository<T>;
}
