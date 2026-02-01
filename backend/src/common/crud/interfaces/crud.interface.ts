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
    deleted?: boolean
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
    deleted?: boolean,
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
    deleted?: boolean,
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
    deleted?: boolean,
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
  ): Promise<void>;

  /**
   * Get repository for the entity
   */
  getRepository(): Repository<T>;
}
