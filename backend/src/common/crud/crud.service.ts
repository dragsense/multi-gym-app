import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  DataSource,
  QueryRunner,
  ObjectLiteral,
  EntityManager,
  Between as TypeOrmBetween,
} from 'typeorm';
import { IPaginatedResponse } from '@shared/interfaces';
import { CrudOptions, ICrudService } from './interfaces/crud.interface';
import { EventPayload, EventService } from '../helper/services/event.service';
import { LoggerService } from '../logger/logger.service';
import {
  getQueryFilters,
  getRelationFilters,
  QueryFilterOptions,
} from '@shared/decorators/crud.dto.decorators';
import { ModuleRef } from '@nestjs/core';
import { RequestContext } from '../context/request-context';
import { EntityRouterService } from '../database/entity-router.service';

@Injectable()
export class CrudService<T extends ObjectLiteral>
  implements ICrudService<T>, OnModuleInit {
  protected readonly logger = new LoggerService(CrudService.name);
  protected readonly repository: Repository<T>;
  protected readonly moduleRef: ModuleRef;
  protected dataSource!: DataSource;
  public eventService!: EventService;
  protected options: CrudOptions;
  protected entityRouterService!: EntityRouterService;

  constructor(
    repository: Repository<T>,
    moduleRef: ModuleRef,
    options?: CrudOptions,
  ) {
    this.repository = repository;
    this.moduleRef = moduleRef;

    // ✅ Merge default + custom options directly here
    this.options = {
      pagination: { defaultLimit: 10, maxLimit: 100 },
      defaultSort: { field: 'id', order: 'ASC' }, // Default sort by ID ascending
      ...options,
    };
  }

  async onModuleInit(): Promise<void> {
    // Auto resolve dependencies
    this.dataSource = this.moduleRef.get(DataSource, { strict: false });
    this.eventService = this.moduleRef.get(EventService, { strict: false });


    this.entityRouterService = this.moduleRef.get(EntityRouterService, { strict: false });

  }

  /**
   * Create a new entity with relation management and event emission
   */
  async create<TCreateDto>(
    createDto: TCreateDto,
    callbacks?: {
      beforeCreate?: (
        processedData: TCreateDto,
        manager: EntityManager,
      ) => any | Promise<any>;
      afterCreate?: (result: any, manager: EntityManager) => any | Promise<any>;
    },
  ): Promise<T> {
    // Get tenant-specific repository to ensure correct data source
    const repository = this.getRepository();
    // Get the data source from the repository (tenant-specific if tenantId exists)
    const dataSource = repository.manager.connection;
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let processedData = createDto as any;

      const userId = RequestContext.get<string>('userId');
      if (userId && !processedData.createdByUserId) {
        processedData = { ...processedData, createdByUserId: userId };
      }

      if (callbacks?.beforeCreate) {
        processedData = await callbacks.beforeCreate(
          processedData,
          queryRunner.manager,
        );
      }

      const entity = repository.create(processedData);
      const savedEntity = await queryRunner.manager.save(entity);
      const finalEntity = Array.isArray(savedEntity)
        ? savedEntity[0]
        : savedEntity;

      // Execute afterCreate callback if provided
      if (callbacks?.afterCreate) {
        await callbacks.afterCreate(finalEntity, queryRunner.manager);
      }

      // Commit transaction after all callbacks
      await queryRunner.commitTransaction(); // Emit after create event
      this.emitEvent('crud.create', finalEntity, undefined, processedData);

      return finalEntity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creating entity: ${error.message}`, error.stack);
      if (error.name === 'HttpException' || error.status) throw error;
      throw new BadRequestException(
        `Failed to create entity: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update an existing entity with relation management and event emission
   */
  async update<TUpdateDto>(
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
  ): Promise<T> {
    // Get tenant-specific repository to ensure correct data source
    const repository = this.getRepository();
    // Get the data source from the repository (tenant-specific if tenantId exists)
    const dataSource = repository.manager.connection;
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const existingEntity = await this.getSingle(key, undefined, undefined, undefined, deleted);

      if (!existingEntity) throw new NotFoundException('Entity not found');

      let processedData = updateDto;

      const userId = RequestContext.get<string>('userId');
      if (userId && !(processedData as any).updatedByUserId) {
        processedData = { ...processedData, updatedByUserId: userId };
      }

      if (callbacks?.beforeUpdate) {
        processedData = await callbacks.beforeUpdate(
          processedData,
          existingEntity,
          queryRunner.manager,
        );
      }

      const merged = queryRunner.manager.merge(
        repository.target as any,
        existingEntity,
        processedData as any,
      );

      const savedEntity = await queryRunner.manager.save(merged);

      // Execute afterUpdate callback if provided
      if (callbacks?.afterUpdate) {
        await callbacks.afterUpdate(savedEntity, queryRunner.manager);
      }

      // Commit transaction after all callbacks
      await queryRunner.commitTransaction();

      // Emit after update event
      this.emitEvent('crud.update', savedEntity, existingEntity, processedData);

      return savedEntity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error updating entity: ${error.message}`, error.stack);
      if (error.name === 'HttpException' || error.status) throw error;
      throw new BadRequestException(
        `Failed to update entity: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get all entities without pagination
   */
  async getAll<TQueryDto>(
    queryDto: TQueryDto,
    dtoClass: any,
    callbacks?: {
      beforeQuery?: (query: any) => any | Promise<any>;
    },
    deleted?: boolean,
  ): Promise<T[]> {
    try {
      const { search, sortFields, sortOrder, sortBy, ...filters } =
        queryDto as any;

      const query = this.getRepository().createQueryBuilder('entity');

      const mergedSortFields = [
        ...(sortFields || []),
        ...(sortBy ? [`${sortBy}:${sortOrder}`] : []),
      ];

      // Apply simplified relations and select system
      this.applyRelationsAndSelect(query, queryDto, mergedSortFields);

      // Apply search functionality
      this.applySearch(query, filters, search);

      // Apply query decorator filters
      this.applyQueryFilters(query, filters, dtoClass);

      // Apply relation filters
      this.applyRelationFilters(query, filters, dtoClass);

      // Execute beforeQuery callback if provided
      if (callbacks?.beforeQuery) {
        await callbacks.beforeQuery(query);
      }

      if (!deleted) {
        query.andWhere('entity.deletedAt IS NULL');
      }

      const result = await query.getMany();

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting all entities without pagination: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to retrieve entities: ${error.message}`,
      );
    }
  }

  /**
   * Get entities with pagination (internal method)
   */
  async get<TQueryDto>(
    queryDto: TQueryDto,
    dtoClass?: any,
    callbacks?: {
      beforeQuery?: (query: any) => any | Promise<any>;
    },
    deleted?: boolean,
  ): Promise<IPaginatedResponse<T>> {
    try {
      const {
        page = 1,
        limit = this.options.pagination?.defaultLimit || 10,
        search,
        sortFields,
        sortOrder,
        sortBy,
        ...filters
      } = queryDto as any;


      // Validate pagination limits
      const maxLimit = this.options.pagination?.maxLimit || 100;
      const validatedLimit = Math.min(limit, maxLimit);
      const skip = (page - 1) * validatedLimit;

      const query = this.getRepository().createQueryBuilder('entity');

      const mergedSortFields = [
        ...(sortFields || []),
        ...(sortBy ? [`${sortBy}:${sortOrder}`] : []),
      ];

      // Apply simplified relations and select system
      this.applyRelationsAndSelect(query, queryDto, mergedSortFields);

      // Apply search functionality
      this.applySearch(query, filters, search);

      // Apply query decorator filters
      this.applyQueryFilters(query, filters, dtoClass);

      // Apply relation filters
      this.applyRelationFilters(query, filters, dtoClass);

      // Execute beforeQuery callback if provided
      if (callbacks?.beforeQuery) {
        await callbacks.beforeQuery(query);
      }

      if (!deleted) {
        query.andWhere('entity.deletedAt IS NULL');
      }

      const [data, total] = await query
        .skip(skip)
        .take(validatedLimit)
        .getManyAndCount();

      const lastPage = Math.ceil(total / validatedLimit);

      return {
        data,
        total,
        page,
        limit: validatedLimit,
        lastPage,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      this.logger.error(
        `Error getting all entities: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to retrieve entities: ${error.message}`,
      );
    }
  }

  /**
   * Get a single entity by any key with nested support (NO pagination)
   */
  async getSingle<TQueryDto>(
    key: string | number | Record<string, any>,
    queryDto?: TQueryDto,
    dtoClass?: any,
    callbacks?: {
      beforeQuery?: (query: any, queryDto: any) => any | Promise<any>;
    },
    deleted?: boolean,
  ): Promise<T | null> {
    try {
      const query = this.getRepository().createQueryBuilder('entity');

      // Handle different key types
      if (typeof key === 'string' || typeof key === 'number') {

        // If key is string or number, assume it's an ID
        query.andWhere('entity.id = :id', { id: key });
      } else if (typeof key === 'object' && key !== null) {
        // If key is an object, handle nested conditions with dot notation
        // Only apply nested conditions if relations are defined
        const relations = (queryDto as any)?._relations || [];

        Object.entries(key).forEach(([field, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (field.includes('.')) {
              // For nested fields, check if the relation path exists in _relations
              const relationPath = field.split('.')[0]; // e.g., 'profile' from 'profile.firstName'
              const fullRelationPath = this.getRelationPath(field, relations); // e.g., 'profile.documents' from 'profile.documents.name'

              if (
                relations.includes(relationPath) ||
                relations.includes(fullRelationPath)
              ) {
                // Create safe parameter name to avoid conflicts
                const paramName = this.createSafeParameterName(field);
                query.andWhere(`${field} = :${paramName}`, {
                  [paramName]: value,
                });
              }
              // If relation not defined, ignore the nested condition
            } else {
              // Direct entity field - always apply
       
              query.andWhere(`entity.${field} = :${field}`, { [field]: value });
            }
          }
        });
      } else {
        throw new BadRequestException('Invalid key provided for getSingle');
      }

      // Apply simplified relations and select system only
      if (queryDto) {
        this.applyRelationsAndSelect(query, queryDto, []);
      }

      // Execute beforeQuery callback if provided


      if (!deleted) {
        query.andWhere('entity.deletedAt IS NULL');
      }

      if (callbacks?.beforeQuery) {
        await callbacks.beforeQuery(query, queryDto);
      }

      const entity = await query.getOne();

      if (!entity) {
        const keyDescription =
          typeof key === 'object' ? JSON.stringify(key) : key;
        this.logger.error(`Entity with key ${keyDescription} not found`);
        return null;
      }

      return entity;
    } catch (error) {
      this.logger.error(
        `Error getting single entity: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to retrieve entity: ${error.message}`,
      );
    }
  }

  /**
   * Delete an entity by ID and return the deleted entity
   */
  async delete(
    key: string | number | Record<string, any>,
    callbacks?: {
      beforeDelete?: (
        entity: any,
        manager: EntityManager,
      ) => any | Promise<any>;
      afterDelete?: (entity: any, manager: EntityManager) => any | Promise<any>;
    },
  ): Promise<T> {
    // Get tenant-specific repository to ensure correct data source
    const repository = this.getRepository();
    // Get the data source from the repository (tenant-specific if tenantId exists)
    const dataSource = repository.manager.connection;
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingEntity = await this.getSingle(key);

      // Execute beforeDelete callback if provided
      if (callbacks?.beforeDelete) {
        await callbacks.beforeDelete(existingEntity, queryRunner.manager);
      }

      const merged = queryRunner.manager.merge(
        repository.target as any,
        existingEntity,
        {
          deletedAt: new Date(),
          deletedByUserId: RequestContext.get<string>('userId'),
        } as any,
      );

      const savedEntity = await queryRunner.manager.save(merged);

      // Execute afterDelete callback if provided
      if (callbacks?.afterDelete) {
        await callbacks.afterDelete(existingEntity, queryRunner.manager);
      }

      // Commit transaction after all callbacks
      await queryRunner.commitTransaction();

      // Emit after delete event
      this.emitEvent('crud.delete', existingEntity);

      return savedEntity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error deleting entity: ${error.message}`, error.stack);
      if (error.name === 'HttpException' || error.status) throw error;
      throw new BadRequestException(
        `Failed to delete entity: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Restore an entity by ID and return the restored entity
   */
  async restore(
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
  ): Promise<T> {
    // Get tenant-specific repository to ensure correct data source
    const repository = this.getRepository();
    // Get the data source from the repository (tenant-specific if tenantId exists)
    const dataSource = repository.manager.connection;
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingEntity = await this.getSingle(key, undefined, undefined, undefined, true);

      // Execute beforeRestore callback if provided
      if (callbacks?.beforeRestore) {
        await callbacks.beforeRestore(existingEntity, queryRunner.manager);
      }

      const merged = queryRunner.manager.merge(
        repository.target as any,
        existingEntity,
        {
          deletedAt: null,
          deletedByUserId: null,
        } as any,
      );

      const savedEntity = await queryRunner.manager.save(merged);

      // Execute afterRestore callback if provided
      if (callbacks?.afterRestore) {
        await callbacks.afterRestore(savedEntity, queryRunner.manager);
      }

      // Commit transaction after all callbacks
      await queryRunner.commitTransaction();

      // Emit after restore event
      this.emitEvent('crud.restore', savedEntity);

      return savedEntity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error restoring entity: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to restore entity: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Permanently delete an entity by ID and return the deleted entity
   */
  async permanentlyDelete(
    key: string | number | Record<string, any>,
    callbacks?: {
      beforeDelete?: (
        entity: any,
        manager: EntityManager,
      ) => any | Promise<any>;
      afterDelete?: (entity: any, manager: EntityManager) => any | Promise<any>;
    },
  ): Promise<void> {
    // Get tenant-specific repository to ensure correct data source
    const repository = this.getRepository();
    // Get the data source from the repository (tenant-specific if tenantId exists)
    const dataSource = repository.manager.connection;
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingEntity = await this.getSingle(key);

      if (!existingEntity) throw new NotFoundException('Entity not found');

      // Execute beforeDelete callback if provided
      if (callbacks?.beforeDelete) {
        await callbacks.beforeDelete(existingEntity, queryRunner.manager);
      }

      await queryRunner.manager.delete(
        repository.target,
        existingEntity.id,
      );

      // Execute afterDelete callback if provided
      if (callbacks?.afterDelete) {
        await callbacks.afterDelete(existingEntity, queryRunner.manager);
      }

      // Commit transaction after all callbacks
      await queryRunner.commitTransaction();

      // Emit after permanently delete event
      this.emitEvent('crud.permanentlyDelete', existingEntity);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error permanently deleting entity: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to permanently delete entity: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get repository for the entity
   */
  getRepository(tenantId?: string): Repository<T> {

    if (this.entityRouterService) {
      // Use tenant-specific database
      const entityClass = this.repository.target as any;
      return this.entityRouterService.getRepository<T>(entityClass, tenantId);
    }

    // Fallback to default repository (main database)
    return this.repository;
  }

  /**
   * Emit CRUD events using NestJS EventEmitter
   * Automatically includes tenantId from RequestContext for multi-tenant support
   */
  public emitEvent(
    operation: string,
    entity: T | null,
    oldEntity?: T,
    data?: any,
  ): void {
    try {
      const source = this.getRepository().metadata.name.toLowerCase();
      // Get tenantId from RequestContext (set by middleware during HTTP requests)
      const tenantId = RequestContext.get<string>('tenantId');

      const payload: EventPayload = {
        entity: entity as T,
        entityId: entity ? (entity as any).id : undefined,
        operation,
        source,
        tableName: this.getRepository().metadata.tableName,
        timestamp: new Date(),
        oldEntity: oldEntity as T,
        data: {
          ...data,
          tenantId, // Include tenantId for multi-tenant database routing in event handlers
        },
      };

      this.eventService.emit(source + '.' + operation, payload);
    } catch (error) {
      this.logger.error(
        `Error emitting ${operation} event: ${error.message}`,
        error.stack,
      );
      // Don't throw error for event emission failures
    }
  }

  /**
   * Apply relations and select system - SIMPLE VERSION
   *
   * Simple approach:
   * 1. Add relations with centralized aliases
   * 2. Check if LEFT JOIN already exists before adding
   * 3. Check if SELECT already exists before adding
   * 4. Handle sorting simply
   * 5. Apply default sort when no sort fields are provided
   */
  private applyRelationsAndSelect(
    query: any,
    queryDto: any,
    mergedSortFields: string[],
  ) {
    const _relations = queryDto._relations || [];
    const _select = queryDto._select || [];
    const _countable = queryDto._countable || [];
    const allRestrictedFields = this.options.restrictedFields || [];

    // Helper functions
    const isFieldRestricted = (field: string): boolean => {
      return (
        allRestrictedFields.includes(field) ||
        allRestrictedFields.some((restricted) =>
          field.startsWith(restricted + '.'),
        )
      );
    };

    const isMainEntityField = (field: string): boolean => !field.includes('.');

    // Track what we've already added to avoid duplicates
    const addedJoins = new Map<string, string>();

    // Step 1: Add relations with centralized aliases
    if (_relations.length > 0) {
      _relations.forEach((relationPath: string) => {
        if (!relationPath?.trim()) return;
        // Build the relation path for COUNT
        const parts = relationPath.split('.');
        let currentAlias = 'entity';
        let fullPath = '';

        parts.forEach((part, index) => {
          fullPath = index === 0 ? part : `${fullPath}.${part}`;
          const newAlias = index === 0 ? part : `${currentAlias}_${part}`;
          const joinKey = `${currentAlias}.${part}`;

          if (!addedJoins.has(joinKey)) {
            query.leftJoin(joinKey, newAlias);
            addedJoins.set(joinKey, newAlias);
          }
          currentAlias = newAlias;
        });
      });
    }

    // Step 2: Add SELECT fields - check if already added
    const fieldsToSelect = new Set<string>();
    const selectableFields = this.options.selectableFields || [];

    // Add user selected fields
    if (_select.length > 0) {
      _select.forEach((field: string) => {
        if (field?.trim() && !isFieldRestricted(field.trim())) {
          fieldsToSelect.add(field.trim());
        }
      });
    }

    // Add selectable fields (always add these)
    if (selectableFields.length > 0) {
      selectableFields.forEach((field: string) => {
        if (!isFieldRestricted(field)) {
          fieldsToSelect.add(field);
        }
      });
    }

    // Don't add sorting fields to SELECT - only use them for ORDER BY
    // This prevents ambiguous column references

    // Apply selections - use select() instead of addSelect() to avoid duplicates
    const mainEntityFields: string[] = [];
    const relationFields: { [alias: string]: string[] } = {};

    fieldsToSelect.forEach((field) => {
      if (isMainEntityField(field)) {
        mainEntityFields.push(field);
      } else {
        // Relation field - find the appropriate alias
        const parts = field.split('.');
        if (parts.length >= 2) {
          const relationName = parts[0];
          const fieldName = parts[parts.length - 1];
          const alias =
            parts.length === 2 ? relationName : parts.slice(0, -1).join('_');

          if (!relationFields[alias]) {
            relationFields[alias] = [];
          }

          relationFields[alias].push(fieldName);
        }
      }
    });

    // Apply main entity selection
    if (mainEntityFields.length > 0) {
      // Always include id if not already present
      const fieldsToSelect = mainEntityFields.includes('id')
        ? mainEntityFields
        : ['id', ...mainEntityFields];

      query.select(fieldsToSelect.map((field) => `entity.${field}`));
    }

    addedJoins.forEach((value, joinKey) => {
      const relationPath = joinKey
        .replace(/^entity\./, '')
        .split('_')
        .join('.');
      const isCountable = _countable.some((c) => c === relationPath);

      if (isCountable) {
        query.loadRelationCountAndMap(
          `entity.${value}Count`,
          `entity.${relationPath}`,
        );
      } else {
        const fields = relationFields[value];
        if (fields?.length > 0) {
          query.addSelect(`${value}.id`);
          fields.forEach(
            (field) => field !== 'id' && query.addSelect(`${value}.${field}`),
          );
        } else {
          query.addSelect(value);
        }
      }
    });

    // Step 3: Apply sorting
    // If no sort fields are provided, apply default sort
    if (mergedSortFields.length === 0 && this.options.defaultSort) {
      const { field, order } = this.options.defaultSort;
      mergedSortFields.push(`${field}:${order}`);
    }

    mergedSortFields.forEach((sortField) => {
      const [fieldName, order = 'ASC'] = sortField.split(':');
      if (!fieldName?.trim()) return;

      const cleanField = fieldName.trim();
      const sortOrder = order.trim().toUpperCase();

      if (isMainEntityField(cleanField)) {
        query.addOrderBy(`entity.${cleanField}`, sortOrder);
      } else {
        // Relation field - find appropriate alias
        const parts = cleanField.split('.');
        if (parts.length >= 2) {
          const relationName = parts[0];
          const fieldName = parts.slice(1).join('.');
          const alias =
            parts.length === 2 ? relationName : parts.slice(0, -1).join('_');

          query.addOrderBy(`${alias}.${fieldName}`, sortOrder);
        }
      }
    });
  }

  /**
   * Apply query filters based on decorator metadata
   */
  private applyQueryFilters(query: any, queryDto: any, dtoClass?: any): void {
    if (!dtoClass) return;

    const queryFilters = getQueryFilters(dtoClass);

    Object.entries(queryFilters).forEach(
      ([propertyKey, filterOptions]: [string, QueryFilterOptions]) => {
        const value = queryDto[propertyKey];

        if (value === undefined || value === null || value === '') {
          return;
        }

        const field = filterOptions.field || propertyKey;
        let processedValue = value;

        // Apply transform if provided
        if (filterOptions.transform) {
          try {
            processedValue = filterOptions.transform(value);
          } catch (error) {
            this.logger.warn(
              `Transform failed for field ${field}: ${error.message}`,
            );
            return;
          }
        }

        // Build proper field reference with entity prefix
        const fieldReference = this.buildFieldReference(field);

        // Create safe parameter name to avoid conflicts
        const paramName = this.createSafeParameterName(propertyKey);

        try {
          // Handle different filter types
          switch (filterOptions.type) {
            case 'between':
              if (
                Array.isArray(processedValue) &&
                processedValue.length === 2
              ) {
                const [startValue, endValue] = processedValue;

                // Handle partial ranges intelligently
                if (startValue && endValue) {
                  // Both values provided - use BETWEEN
                  query.andWhere(
                    `${fieldReference} BETWEEN :${paramName}_start AND :${paramName}_end`,
                    {
                      [`${paramName}_start`]: startValue,
                      [`${paramName}_end`]: endValue,
                    },
                  );
                } else if (startValue && !endValue) {
                  // Only start value provided - use greaterThan
                  query.andWhere(`${fieldReference} >= :${paramName}_start`, {
                    [`${paramName}_start`]: startValue,
                  });
                } else if (!startValue && endValue) {
                  // Only end value provided - use lessThan
                  query.andWhere(`${fieldReference} <= :${paramName}_end`, {
                    [`${paramName}_end`]: endValue,
                  });
                }
                // If both are null/undefined, no filter is applied
              }
              break;

            case 'lessThan':
              query.andWhere(`${fieldReference} < :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            case 'greaterThan':
              query.andWhere(`${fieldReference} > :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            case 'lessThanOrEqual':
              query.andWhere(`${fieldReference} <= :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            case 'greaterThanOrEqual':
              query.andWhere(`${fieldReference} >= :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            case 'like':
              query.andWhere(`${fieldReference} ILIKE :${paramName}`, {
                [paramName]: `%${processedValue}%`,
              });
              break;

            case 'in':
              if (Array.isArray(processedValue)) {
                query.andWhere(`${fieldReference} IN (:...${paramName})`, {
                  [paramName]: processedValue,
                });
              }
              break;

            case 'notIn':
              if (Array.isArray(processedValue)) {
                query.andWhere(`${fieldReference} NOT IN (:...${paramName})`, {
                  [paramName]: processedValue,
                });
              }
              break;

            case 'isNull':
              if (processedValue === true) {
                query.andWhere(`${fieldReference} IS NULL`);
              } else if (processedValue === false) {
                query.andWhere(`${fieldReference} IS NOT NULL`);
              }
              break;

            case 'isNotNull':
              if (processedValue === true) {
                query.andWhere(`${fieldReference} IS NOT NULL`);
              } else if (processedValue === false) {
                query.andWhere(`${fieldReference} IS NULL`);
              }
              break;

            case 'equals':
              query.andWhere(`${fieldReference} = :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            case 'notEquals':
              query.andWhere(`${fieldReference} != :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            default:
              // Fallback to simple equality
              query.andWhere(`${fieldReference} = :${paramName}`, {
                [paramName]: processedValue,
              });
              break;
          }
        } catch (error) {
          this.logger.error(
            `Error applying query filter for field ${field}: ${error.message}`,
            error.stack,
          );
          // Continue with other filters instead of breaking the entire query
        }
      },
    );
  }

  /**
   * Apply relation filters based on decorator metadata
   */
  private applyRelationFilters(
    query: any,
    queryDto: any,
    dtoClass?: any,
  ): void {
    if (!dtoClass) {
      return;
    }

    const relationFilters = getRelationFilters(dtoClass);

    Object.entries(relationFilters).forEach(
      ([propertyKey, relationPath]: [string, string]) => {
        const value = queryDto[propertyKey];

        if (value === undefined || value === null || value === '') {
          return;
        }

        // Get the filter type from other decorators (like @Equals, @Like, etc.)
        const queryFilters = getQueryFilters(dtoClass);
        const filterOptions = queryFilters[propertyKey];
        const type = filterOptions?.type || 'equals';
        const transform = filterOptions?.transform;

        let processedValue = value;

        // Apply transform if provided
        if (transform) {
          try {
            processedValue = transform(value);
          } catch (error) {
            this.logger.warn(
              `Transform failed for relation field ${relationPath}: ${error.message}`,
            );
            return;
          }
        }

        // The relationPath is the complete field reference (e.g., 'profile.firstName')
        const fieldReference = relationPath;

        // Create safe parameter name to avoid conflicts
        const paramName = this.createSafeParameterName(
          `${relationPath.replace(/\./g, '_')}_${propertyKey}`,
        );

        try {
          // Handle different filter types for relations
          switch (type) {
            case 'between':
              if (
                Array.isArray(processedValue) &&
                processedValue.length === 2
              ) {
                const [startValue, endValue] = processedValue;

                // Handle partial ranges intelligently
                if (startValue && endValue) {
                  // Both values provided - use BETWEEN
                  query.andWhere(
                    `${fieldReference} BETWEEN :${paramName}_start AND :${paramName}_end`,
                    {
                      [`${paramName}_start`]: startValue,
                      [`${paramName}_end`]: endValue,
                    },
                  );
                } else if (startValue && !endValue) {
                  // Only start value provided - use greaterThan
                  query.andWhere(`${fieldReference} >= :${paramName}_start`, {
                    [`${paramName}_start`]: startValue,
                  });
                } else if (!startValue && endValue) {
                  // Only end value provided - use lessThan
                  query.andWhere(`${fieldReference} <= :${paramName}_end`, {
                    [`${paramName}_end`]: endValue,
                  });
                }
                // If both are null/undefined, no filter is applied
              }
              break;

            case 'lessThan':
              query.andWhere(`${fieldReference} < :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            case 'greaterThan':
              query.andWhere(`${fieldReference} > :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            case 'lessThanOrEqual':
              query.andWhere(`${fieldReference} <= :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            case 'greaterThanOrEqual':
              query.andWhere(`${fieldReference} >= :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            case 'like':
              query.andWhere(`${fieldReference} ILIKE :${paramName}`, {
                [paramName]: `%${processedValue}%`,
              });
              break;

            case 'in':
              if (Array.isArray(processedValue)) {
                query.andWhere(`${fieldReference} IN (:...${paramName})`, {
                  [paramName]: processedValue,
                });
              }
              break;

            case 'notIn':
              if (Array.isArray(processedValue)) {
                query.andWhere(`${fieldReference} NOT IN (:...${paramName})`, {
                  [paramName]: processedValue,
                });
              }
              break;

            case 'isNull':
              if (processedValue === true) {
                query.andWhere(`${fieldReference} IS NULL`);
              } else if (processedValue === false) {
                query.andWhere(`${fieldReference} IS NOT NULL`);
              }
              break;

            case 'isNotNull':
              if (processedValue === true) {
                query.andWhere(`${fieldReference} IS NOT NULL`);
              } else if (processedValue === false) {
                query.andWhere(`${fieldReference} IS NULL`);
              }
              break;

            case 'equals':
              query.andWhere(`${fieldReference} = :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            case 'notEquals':
              query.andWhere(`${fieldReference} != :${paramName}`, {
                [paramName]: processedValue,
              });
              break;

            default:
              // Fallback to simple equality
              query.andWhere(`${fieldReference} = :${paramName}`, {
                [paramName]: processedValue,
              });
              break;
          }
        } catch (error) {
          this.logger.error(
            `Error applying relation filter for field ${fieldReference}: ${error.message}`,
            error.stack,
          );
          // Continue with other filters instead of breaking the entire query
        }
      },
    );
  }

  /**
   * Apply search functionality using searchable fields
   */
  private applySearch(query: any, queryDto: any, search?: string): void {
    if (!search) {
      return;
    }

    const _searchable = queryDto._searchable;

    // Get restricted fields from backend configuration only (security)
    const allRestrictedFields = this.options.restrictedFields || [];

    // Helper function to check if field is restricted
    const isFieldRestricted = (field: string): boolean => {
      return (
        allRestrictedFields.includes(field) ||
        allRestrictedFields.some((restricted) =>
          field.startsWith(restricted + '.'),
        )
      );
    };

    let searchableFields: string[] = [];

    // Use _searchable if provided, otherwise fallback to default searchable fields
    if (_searchable && Array.isArray(_searchable) && _searchable.length > 0) {
      searchableFields = _searchable;
    } else {
      // Fallback to default searchable fields from backend configuration
      const defaultSearchableFields = this.options.searchableFields || [];
      searchableFields = defaultSearchableFields;
    }

    if (searchableFields.length > 0) {
      const searchConditions = searchableFields
        .filter((field) => field && field.trim())
        .filter((field) => !isFieldRestricted(field.trim())) // Filter restricted fields from search
        .map((field) => {
          const cleanField = field.trim();
          if (cleanField.includes('.')) {
            // Nested field (e.g., profile.firstName)
            return `${cleanField} ILIKE :search`;
          } else {
            // Direct entity field
            return `entity.${cleanField} ILIKE :search`;
          }
        })
        .join(' OR ');

      if (searchConditions) {
        query.andWhere(`(${searchConditions})`, { search: `%${search}%` });
      }
    }
  }

  /**
   * Build proper field reference with entity prefix for nested fields
   */
  private buildFieldReference(field: string): string {
    // If field contains a dot, it's a nested field (e.g., profile.firstName)
    if (field.includes('.')) {
      return field; // Already has proper format
    }
    // For direct entity fields, prefix with entity.
    return `entity.${field}`;
  }

  /**
   * Create safe parameter name to avoid conflicts with SQL keywords
   */
  private createSafeParameterName(propertyKey: string): string {
    // Replace dots and special characters with underscores
    return propertyKey.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Get relation path from nested field
   */
  private getRelationPath(field: string, relations: string[]): string {
    const parts = field.split('.');
    if (parts.length <= 1) return parts[0];

    // Find the longest matching relation path
    for (let i = parts.length - 1; i >= 1; i--) {
      const relationPath = parts.slice(0, i).join('.');
      if (relations.includes(relationPath)) {
        return relationPath;
      }
    }

    return parts[0]; // Fallback to first part
  }

  /**
   * Build nested where condition for complex queries
   */
  private buildNestedWhereCondition(
    key: Record<string, any>,
  ): FindOptionsWhere<T> {
    const whereCondition: any = {};

    for (const [field, value] of Object.entries(key)) {
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Handle nested objects (relations)
        whereCondition[field] = this.buildNestedWhereCondition(value);
      } else if (Array.isArray(value)) {
        // Handle array values (IN queries)
        whereCondition[field] = value;
      } else if (typeof value === 'string' && value.includes('%')) {
        // Handle LIKE queries
        whereCondition[field] = value;
      } else {
        // Handle simple equality
        whereCondition[field] = value;
      }
    }

    return whereCondition as FindOptionsWhere<T>;
  }
}
