import { ConfigService, registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

// Database modes
export enum DatabaseMode {
  SINGLE = 'single',
  MULTI_SCHEMA = 'multi-schema',
  MULTI_DATABASE = 'multi-database',
}

// Connection interface
export interface DatabaseConnection {
  name: string;
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema?: string;
  ssl?: boolean | object;
  pool?: {
    max: number;
    min: number;
    idle: number;
    connTimeout: number;
  };
  synchronize?: boolean;
  logging?: boolean;
  extra?: Record<string, any>;
}

// Main config interface
export interface DatabaseConfig {
  mode: DatabaseMode;
  defaultConnection: string;
  connections: Record<string, DatabaseConnection>;
  autoReplica: boolean;
  autoArchive: boolean;
  healthCheck: {
    interval: number;
    timeout: number;
    query: string;
  };
  retry: {
    maxAttempts: number;
    delay: number;
    backoffMultiplier: number;
  };
}

// Full configuration
export default registerAs('database', (): DatabaseConfig => {
  // Validate database mode
  const validateDatabaseMode = (mode: string): DatabaseMode | null => {
    return Object.values(DatabaseMode).includes(mode as DatabaseMode)
      ? (mode as DatabaseMode)
      : null;
  };

  const dbMode = process.env.DB_MODE || DatabaseMode.SINGLE;
  const mode = validateDatabaseMode(dbMode);

  if (!mode) {
    throw new Error('Invalid DB_MODE environment variable.');
  }

  const defaultConnectionName = process.env.DB_DEFAULT_CONNECTION || 'default';

  // Base connection
  const baseConnection: DatabaseConnection = {
    name: defaultConnectionName,
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'Customer_app',
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '20', 10),
      min: parseInt(process.env.DB_POOL_MIN || '5', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '30000', 10),
      connTimeout: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '5000', 10),
    },
    synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
    logging: process.env.TYPEORM_LOGGING === 'true',
  };

  // Validate required fields
  if (
    !baseConnection.host ||
    !baseConnection.username ||
    !baseConnection.password
  ) {
    throw new Error(
      'Database configuration incomplete. Check DB_HOST, DB_USER, DB_PASS.',
    );
  }

  return {
    mode,
    defaultConnection: defaultConnectionName,
    connections: {
      [defaultConnectionName]: baseConnection,
    },
    autoReplica: process.env.DB_AUTO_REPLICA === 'true',
    autoArchive: process.env.DB_AUTO_ARCHIVE === 'true',
    healthCheck: {
      interval: parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000', 10),
      timeout: parseInt(process.env.DB_HEALTH_CHECK_TIMEOUT || '5000', 10),
      query: process.env.DB_HEALTH_CHECK_QUERY || 'SELECT 1',
    },
    retry: {
      maxAttempts: parseInt(process.env.DB_RETRY_MAX_ATTEMPTS || '3', 10),
      delay: parseInt(process.env.DB_RETRY_DELAY || '1000', 10),
      backoffMultiplier: parseFloat(
        process.env.DB_RETRY_BACKOFF_MULTIPLIER || '2',
      ),
    },
  };
});

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const dbConfig = configService.get<DatabaseConfig>('database');

  if (!dbConfig) throw new Error('Database config not found.');

  const defaultConnection = dbConfig.connections[dbConfig.defaultConnection];

  if (!defaultConnection) throw new Error(`Database config not found.`);

  return {
    ...defaultConnection,
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [
      join(__dirname, '../migrations/common/**/*{.ts,.js}'),
      join(__dirname, '../migrations/modules/**/*{.ts,.js}'),
    ],
    autoLoadEntities: true,
  };
};
