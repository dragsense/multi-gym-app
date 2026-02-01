import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralBaseEntity } from '@/common/entities';
import { DatabaseMode } from '@/config/database.config';

export enum ConnectionType {
  MAIN = 'main',
  REPLICA = 'replica',
  ARCHIVE = 'archive',
  TENANT_SCHEMA = 'tenant_schema',
  TENANT_DATABASE = 'tenant_database',
}

export enum ConnectionStatus {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DISCONNECTED = 'disconnected',
}

@Entity('database_connections')
@Index('idx_connection_name', ['connectionName'], { unique: true })
@Index('idx_connection_type', ['connectionType'])
@Index('idx_status', ['status'])
export class DatabaseConnectionEntity extends GeneralBaseEntity {
  @ApiProperty({
    example: 'main',
    description: 'Unique connection name identifier',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  connectionName: string;

  @ApiProperty({
    enum: ConnectionType,
    example: ConnectionType.MAIN,
    description: 'Type of database connection',
  })
  @Column({
    type: 'enum',
    enum: ConnectionType,
  })
  connectionType: ConnectionType;

  @ApiProperty({
    enum: DatabaseMode,
    example: DatabaseMode.SINGLE,
    description: 'Database mode for this connection',
  })
  @Column({
    type: 'enum',
    enum: DatabaseMode,
  })
  databaseMode: DatabaseMode;

  @ApiProperty({
    example: 'localhost',
    description: 'Database host',
  })
  @Column({ type: 'varchar', length: 255 })
  host: string;

  @ApiProperty({
    example: 5432,
    description: 'Database port',
  })
  @Column({ type: 'int' })
  port: number;

  @ApiProperty({
    example: 'my_database',
    description: 'Database name',
  })
  @Column({ type: 'varchar', length: 255 })
  database: string;

  @ApiProperty({
    example: 'tenant_123',
    description: 'Schema name (for multi-schema mode)',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  schema?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Tenant ID (for tenant-specific connections)',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  @Index('idx_tenant_id', ['tenantId'])
  tenantId?: string;

  @ApiProperty({
    enum: ConnectionStatus,
    example: ConnectionStatus.READY,
    description: 'Current status of the connection',
  })
  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @ApiProperty({
    example: 'Connection initialized successfully',
    description: 'Status message or error description',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  statusMessage?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Last time connection was checked',
    required: false,
  })
  @Column({ type: 'timestamptz', nullable: true })
  lastCheckedAt?: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Last time connection was successfully connected',
    required: false,
  })
  @Column({ type: 'timestamptz', nullable: true })
  lastConnectedAt?: Date;
}
