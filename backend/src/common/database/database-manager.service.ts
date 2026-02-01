import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions, Repository } from 'typeorm';
import {
  DatabaseConfig,
  DatabaseMode,
  DatabaseConnection,
} from '@/config/database.config';
import { join } from 'path';
import {
  DatabaseConnectionEntity,
  ConnectionType,
  ConnectionStatus,
} from './entities/database-connection.entity';
import { SeedRunnerService } from '@/seeds/seed-runner.service';

export interface TenantContext {
  tenantId?: string;
}

@Injectable()
export class DatabaseManager implements OnModuleInit {
  private readonly logger = new Logger(DatabaseManager.name);
  private connections: Map<string, DataSource> = new Map();
  private dbConfig: DatabaseConfig;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(DatabaseConnectionEntity)
    private readonly connectionRepository: Repository<DatabaseConnectionEntity>,
    private readonly seedRunnerService: SeedRunnerService,
  ) { }

  async onModuleInit() {
    this.dbConfig = this.configService.get<DatabaseConfig>('database')!;
    await this.initializeSystem();
    await this.ensureAllConnectionsReady();
  }

  /**
   * Get default database name
   */
  private getDefaultDatabase(): string {
    return this.dbConfig.connections[this.dbConfig.defaultConnection].database;
  }

  private async initializeSystem() {
    this.logger.log(
      `Initializing database system in ${this.dbConfig.mode} mode`,
    );

    this.logger.log(`Auto-replica setting: ${this.dbConfig.autoReplica}`);
    this.logger.log(`Auto-archive setting: ${this.dbConfig.autoArchive}`);

    // Initialize main connection
    await this.initializeMainConnection();

    // Initialize auto-replica if enabled
    if (this.dbConfig.autoReplica) {
      await this.initializeReplica();
    }

    // Initialize auto-archive if enabled
    if (this.dbConfig.autoArchive) {
      await this.initializeArchive();
    }

    // Load and restore existing tenant connections from database
    await this.loadExistingConnections();
  }

  /**
   * Load existing connections from database and restore them
   */
  private async loadExistingConnections() {
    try {
      const existingConnections = await this.connectionRepository.find({
        where: {
          status: ConnectionStatus.READY,
        },
      });

      this.logger.log(
        `Found ${existingConnections.length} existing connections in database`,
      );

      for (const connEntity of existingConnections) {
        try {
          // Skip if connection already exists in memory
          if (this.connections.has(connEntity.connectionName)) {
            continue;
          }

          // Restore tenant connections
          if (
            connEntity.connectionType === ConnectionType.TENANT_SCHEMA ||
            connEntity.connectionType === ConnectionType.TENANT_DATABASE
          ) {
            if (connEntity.tenantId) {
              await this.restoreTenantConnection(connEntity);
            }
          } else if (connEntity.connectionType === ConnectionType.REPLICA) {
            // Replica connections are handled in initializeReplica
            continue;
          } else if (connEntity.connectionType === ConnectionType.ARCHIVE) {
            // Archive connections are handled in initializeArchive
            continue;
          }

        } catch (error) {
          this.logger.error(
            `Failed to restore connection ${connEntity.connectionName}: ${error.message}`,
          );
          // Update status to error
          await this.updateConnectionStatus(
            connEntity.connectionName,
            ConnectionStatus.ERROR,
            error.message,
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to load existing connections: ${error.message}`,
      );
    }
  }

  /**
   * Restore a tenant connection from entity
   */
  private async restoreTenantConnection(
    connEntity: DatabaseConnectionEntity,
  ): Promise<void> {
    const mainConfig =
      this.dbConfig.connections[this.dbConfig.defaultConnection];

    let connectionConfig: DatabaseConnection;

    if (connEntity.connectionType === ConnectionType.TENANT_SCHEMA) {
      connectionConfig = {
        ...mainConfig,
        name: connEntity.connectionName,
        schema: connEntity.schema,
      };
    } else {
      connectionConfig = {
        ...mainConfig,
        name: connEntity.connectionName,
        database: connEntity.database,
      };
    }

    const dataSource = await this.createConnection(
      connEntity.connectionName,
      connectionConfig,
    );
    this.connections.set(connEntity.connectionName, dataSource);

    await this.updateConnectionStatus(
      connEntity.connectionName,
      ConnectionStatus.READY,
      'Connection restored successfully',
    );
    
    this.logger.log(
      `Restored connection: ${connEntity.connectionName} for tenant: ${connEntity.tenantId}`,
    );
  }

  /**
   * Ensure all connections are ready and healthy
   */
  private async ensureAllConnectionsReady() {
    this.logger.log('Ensuring all connections are ready...');

    const connectionNames = Array.from(this.connections.keys());
    const readyConnections: string[] = [];
    const failedConnections: string[] = [];

    for (const connectionName of connectionNames) {
      try {
        const connection = this.connections.get(connectionName);
        if (!connection) {
          failedConnections.push(connectionName);
          continue;
        }

        // Test connection
        await connection.query('SELECT 1');
        readyConnections.push(connectionName);

        // Update status in database
        await this.updateConnectionStatus(
          connectionName,
          ConnectionStatus.READY,
          'Connection is ready',
        );
      } catch (error) {
        this.logger.error(
          `Connection ${connectionName} is not ready: ${error.message}`,
        );
        failedConnections.push(connectionName);

        // Update status in database
        await this.updateConnectionStatus(
          connectionName,
          ConnectionStatus.ERROR,
          error.message,
        );
      }
    }

    this.logger.log(
      `Connections ready: ${readyConnections.length}/${connectionNames.length}`,
    );
    if (readyConnections.length > 0) {
      this.logger.log(`Ready connections: ${readyConnections.join(', ')}`);
    }
    if (failedConnections.length > 0) {
      this.logger.warn(`Failed connections: ${failedConnections.join(', ')}`);
    }
  }

  /**
   * Update connection status in database
   */
  private async updateConnectionStatus(
    connectionName: string,
    status: ConnectionStatus,
    message?: string,
  ): Promise<void> {
    try {
      const connection = await this.connectionRepository.findOne({
        where: { connectionName },
      });

      if (connection) {
        connection.status = status;
        connection.statusMessage = message;
        connection.lastCheckedAt = new Date();
        if (status === ConnectionStatus.READY) {
          connection.lastConnectedAt = new Date();
        }
        await this.connectionRepository.save(connection);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to update connection status for ${connectionName}: ${error.message}`,
      );
    }
  }

  /**
   * Save or update connection entity in database
   */
  private async saveConnectionEntity(
    connectionName: string,
    connectionType: ConnectionType,
    config: DatabaseConnection,
    tenantId?: string,
  ): Promise<void> {
    try {
      let connection = await this.connectionRepository.findOne({
        where: { connectionName },
      });

      if (!connection) {
        connection = this.connectionRepository.create({
          connectionName,
          connectionType,
          databaseMode: this.dbConfig.mode,
          host: config.host,
          port: config.port,
          database: config.database,
          schema: config.schema,
          tenantId,
          status: ConnectionStatus.INITIALIZING,
        });
      } else {
        connection.host = config.host;
        connection.port = config.port;
        connection.database = config.database;
        connection.schema = config.schema;
        connection.status = ConnectionStatus.INITIALIZING;
      }

      await this.connectionRepository.save(connection);
    } catch (error) {
      this.logger.warn(
        `Failed to save connection entity for ${connectionName}: ${error.message}`,
      );
    }
  }

  private async initializeMainConnection() {
    const mainConnection =
      this.dbConfig.connections[this.dbConfig.defaultConnection];

    await this.saveConnectionEntity(
      'main',
      ConnectionType.MAIN,
      mainConnection,
    );

    const dataSource = await this.createConnection('main', mainConnection);
    this.connections.set('main', dataSource);

    await this.updateConnectionStatus(
      'main',
      ConnectionStatus.READY,
      'Main connection initialized successfully',
    );

    this.logger.log('Main database connection initialized');
  }

  private async initializeReplica() {
    const mainConnection =
      this.dbConfig.connections[this.dbConfig.defaultConnection];
    const replicaConnection: DatabaseConnection = {
      ...mainConnection,
      name: 'replica',
      database: `${mainConnection.database}_replica`,
    };

    await this.saveConnectionEntity(
      'replica',
      ConnectionType.REPLICA,
      replicaConnection,
    );

    const dataSource = await this.createConnection(
      'replica',
      replicaConnection,
    );
    this.connections.set('replica', dataSource);

    await this.updateConnectionStatus(
      'replica',
      ConnectionStatus.READY,
      'Replica connection initialized successfully',
    );

    this.logger.log('Replica database connection initialized');
  }

  private async initializeArchive() {
    const mainConnection =
      this.dbConfig.connections[this.dbConfig.defaultConnection];
    const archiveConnection: DatabaseConnection = {
      ...mainConnection,
      name: 'archive',
      database: `${mainConnection.database}_archive`,
    };

    await this.saveConnectionEntity(
      'archive',
      ConnectionType.ARCHIVE,
      archiveConnection,
    );

    const dataSource = await this.createConnection(
      'archive',
      archiveConnection,
    );
    this.connections.set('archive', dataSource);

    await this.updateConnectionStatus(
      'archive',
      ConnectionStatus.READY,
      'Archive connection initialized successfully',
    );

    this.logger.log('Archive database connection initialized');
  }

  private async createConnection(
    name: string,
    config: DatabaseConnection,
  ): Promise<DataSource> {
    const options: DataSourceOptions = {
      ...config,
      entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
      migrations: [
        join(__dirname, '../../migrations/common/**/*{.ts,.js}'),
        join(__dirname, '../../migrations/modules/**/*{.ts,.js}'),
      ],
    };

    const dataSource = new DataSource(options);
    await dataSource.initialize();
    return dataSource;
  }

  /**
   * Auto-create tenant schema/database when new tenant registers
   */
  async createTenantResources(tenantId: string): Promise<void> {
    this.logger.log(`Creating resources for tenant: ${tenantId}`);

    switch (this.dbConfig.mode) {
      case DatabaseMode.SINGLE:
        // Single mode - no tenant-specific resources needed
        break;

      case DatabaseMode.MULTI_SCHEMA:
        await this.createTenantSchema(tenantId);
        break;

      case DatabaseMode.MULTI_DATABASE:
        await this.createTenantDatabase(tenantId);
        break;
    }

    // Create replica for tenant if auto-replica is enabled
    if (this.dbConfig.autoReplica) {
      await this.createTenantReplica(tenantId);
    }

    // Create archive for tenant if auto-archive is enabled
    if (this.dbConfig.autoArchive) {
      await this.createTenantArchive(tenantId);
    }
  }

  private async createTenantSchema(tenantId: string) {
    const defaultDatabase = this.getDefaultDatabase();
    const schemaName = `${defaultDatabase}_tenant_${tenantId}`;
    const mainConnection = this.connections.get('main');
    if (!mainConnection) {
      throw new Error('Main connection not found');
    }

    // Create schema
    await mainConnection.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    // Create connection for this schema
    const mainConfig =
      this.dbConfig.connections[this.dbConfig.defaultConnection];
    const connectionName = `schema_${tenantId}`;
    const schemaConnection: DatabaseConnection = {
      ...mainConfig,
      name: connectionName,
      schema: schemaName,
    };

    await this.saveConnectionEntity(
      connectionName,
      ConnectionType.TENANT_SCHEMA,
      schemaConnection,
      tenantId,
    );

    const dataSource = await this.createConnection(
      connectionName,
      schemaConnection,
    );
    this.connections.set(connectionName, dataSource);

    await this.updateConnectionStatus(
      connectionName,
      ConnectionStatus.READY,
      'Tenant schema connection created successfully',
    );

    this.logger.log(`Created schema and connection for tenant: ${tenantId}`);

    // Run seeding for the new tenant (non-blocking)
    void this.runTenantSeeding(dataSource, tenantId);
  }

  private async createTenantDatabase(tenantId: string) {
    const defaultDatabase = this.getDefaultDatabase();

    const databaseName = `${defaultDatabase}_tenant_${tenantId}`;
    const connectionName = `tenant_${tenantId}`;

    // Check if connection already exists
    if (this.connections.has(connectionName)) {
      this.logger.log(`Database connection already exists for tenant: ${tenantId}`);
      return;
    }

    const mainConnection = this.connections.get('main');
    if (!mainConnection) {
      throw new Error('Main connection not found');
    }

    // Check if database already exists
    const databaseExists = await mainConnection.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName],
    );

    if (databaseExists.length > 0) {
      this.logger.log(`Database already exists: ${databaseName}`);
    } else {
      // Create database
      this.logger.log(`Creating database: ${databaseName}`);
      await mainConnection.query(`CREATE DATABASE "${databaseName}"`);
    }

    // Create connection for this database
    const mainConfig =
      this.dbConfig.connections[this.dbConfig.defaultConnection];
    const tenantConnection: DatabaseConnection = {
      ...mainConfig,
      name: connectionName,
      database: databaseName,
    };

    await this.saveConnectionEntity(
      connectionName,
      ConnectionType.TENANT_DATABASE,
      tenantConnection,
      tenantId,
    );

    const dataSource = await this.createConnection(
      connectionName,
      tenantConnection,
    );
    this.connections.set(connectionName, dataSource);

    await this.updateConnectionStatus(
      connectionName,
      ConnectionStatus.READY,
      'Tenant database connection created successfully',
    );

    this.logger.log(`Created database and connection for tenant: ${tenantId}`);

    // Run seeding for the new tenant (non-blocking)
    void this.runTenantSeeding(dataSource, tenantId);
  }

  private async createTenantReplica(tenantId: string) {
    const defaultDatabase = this.getDefaultDatabase();
    const replicaName = `replica_tenant_${tenantId}`;
    const mainConfig =
      this.dbConfig.connections[this.dbConfig.defaultConnection];
    let replicaConnection: DatabaseConnection;

    if (this.dbConfig.mode === DatabaseMode.MULTI_SCHEMA) {
      replicaConnection = {
        ...mainConfig,
        name: replicaName,
        database: `${defaultDatabase}_replica`,
        schema: `tenant_${tenantId}`,
      };
    } else {
      replicaConnection = {
        ...mainConfig,
        name: replicaName,
        database: `${defaultDatabase}_tenant_${tenantId}_replica`,
      };
    }

    await this.saveConnectionEntity(
      replicaName,
      ConnectionType.REPLICA,
      replicaConnection,
      tenantId,
    );

    const dataSource = await this.createConnection(
      replicaName,
      replicaConnection,
    );
    this.connections.set(replicaName, dataSource);

    await this.updateConnectionStatus(
      replicaName,
      ConnectionStatus.READY,
      'Tenant replica connection created successfully',
    );

    this.logger.log(`Created replica for tenant: ${tenantId}`);
  }

  private async createTenantArchive(tenantId: string) {
    const defaultDatabase = this.getDefaultDatabase();
    const archiveName = `${defaultDatabase}_archive_tenant_${tenantId}`;
    const mainConfig =
      this.dbConfig.connections[this.dbConfig.defaultConnection];

    let archiveConnection: DatabaseConnection;

    if (this.dbConfig.mode === DatabaseMode.MULTI_SCHEMA) {
      archiveConnection = {
        ...mainConfig,
        name: archiveName,
        database: `${defaultDatabase}_archive`,
        schema: `tenant_${tenantId}`,
      };
    } else {
      archiveConnection = {
        ...mainConfig,
        name: archiveName,
        database: `${defaultDatabase}_tenant_${tenantId}_archive`,
      };
    }

    await this.saveConnectionEntity(
      archiveName,
      ConnectionType.ARCHIVE,
      archiveConnection,
      tenantId,
    );

    const dataSource = await this.createConnection(
      archiveName,
      archiveConnection,
    );
    this.connections.set(archiveName, dataSource);

    await this.updateConnectionStatus(
      archiveName,
      ConnectionStatus.READY,
      'Tenant archive connection created successfully',
    );

    this.logger.log(`Created archive for tenant: ${tenantId}`);
  }

  /**
   * Get repository for entity with automatic tenant routing
   */
  getRepository<T extends Record<string, any>>(
    entity: any,
    context?: TenantContext,
  ): Repository<T> {
    let connectionName = 'main';

    if (context?.tenantId) {
      switch (this.dbConfig.mode) {
        case DatabaseMode.MULTI_SCHEMA:
          connectionName = `schema_${context.tenantId}`;
          break;
        case DatabaseMode.MULTI_DATABASE:
          connectionName = `tenant_${context.tenantId}`;
          break;
      }
    }

    const connection = this.connections.get(connectionName);
    if (!connection) {
      throw new Error(`Connection '${connectionName}' not found`);
    }

    return connection.getRepository(entity);
  }

  /**
   * Get read-only repository (replica)
   */
  getReadOnlyRepository<T extends Record<string, any>>(
    entity: any,
    context?: TenantContext,
  ): Repository<T> {
    let connectionName = 'replica';

    if (context?.tenantId) {
      connectionName = `replica_tenant_${context.tenantId}`;
    }

    const connection = this.connections.get(connectionName);
    if (!connection) {
      // Fallback to main connection if replica not available
      return this.getRepository(entity, context);
    }

    return connection.getRepository(entity);
  }

  /**
   * Get archive repository
   */
  getArchiveRepository<T extends Record<string, any>>(
    entity: any,
    context?: TenantContext,
  ): Repository<T> {
    let connectionName = 'archive';

    if (context?.tenantId) {
      connectionName = `archive_tenant_${context.tenantId}`;
    }

    const connection = this.connections.get(connectionName);
    if (!connection) {
      throw new Error(
        `Archive connection not found for tenant: ${context?.tenantId}`,
      );
    }

    return connection.getRepository(entity);
  }

  /**
   * Execute query with automatic routing
   */
  async executeQuery(
    query: string,
    parameters: any[] = [],
    context?: TenantContext,
  ): Promise<any> {
    let connectionName = 'main';

    if (context?.tenantId) {
      switch (this.dbConfig.mode) {
        case DatabaseMode.MULTI_SCHEMA:
          connectionName = `schema_${context.tenantId}`;
          break;
        case DatabaseMode.MULTI_DATABASE:
          connectionName = `tenant_${context.tenantId}`;
          break;
      }
    }

    const connection = this.connections.get(connectionName);
    if (!connection) {
      throw new Error(`Connection '${connectionName}' not found`);
    }

    return connection.query(query, parameters);
  }

  /**
   * Get current mode
   */
  getMode(): DatabaseMode {
    return this.dbConfig.mode;
  }

  /** 
   * Get Default Connection
   */
  getDefaultConnection(): DatabaseConnection {
    return this.dbConfig.connections[this.dbConfig.defaultConnection];
  }

  /**
   * Get all connections
   */
  getAllConnections(): Map<string, DataSource> {
    return new Map(this.connections);
  }

  /**
   * Check if tenant resources exist
   */
  async tenantExists(tenantId: string): Promise<boolean> {
    const connectionName =
      this.dbConfig.mode === DatabaseMode.MULTI_SCHEMA
        ? `schema_${tenantId}`
        : `tenant_${tenantId}`;

    return this.connections.has(connectionName);
  }

  /**
   * Run seeding for a tenant
   */
  private async runTenantSeeding(
    dataSource: DataSource,
    tenantId?: string,
  ): Promise<void> {
    try {
      this.logger.log(`Running tenant seeding for tenant: ${tenantId ?? 'system'}`);
      await this.seedRunnerService.runAllSeeds(dataSource, tenantId);
      this.logger.log(`Tenant seeding completed for tenant: ${tenantId ?? 'system'}`);
    } catch (error) {
      this.logger.error(
        `Failed to run tenant seeding for tenant ${tenantId}: ${error.message}`,
      );
      // Don't throw - seeding failure shouldn't prevent tenant creation
    }
  }

}
