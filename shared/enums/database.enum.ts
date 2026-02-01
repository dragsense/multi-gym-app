export enum EConnectionType {
  MAIN = 'main',
  REPLICA = 'replica',
  ARCHIVE = 'archive',
  TENANT_SCHEMA = 'tenant_schema',
  TENANT_DATABASE = 'tenant_database',
}

export enum EConnectionStatus {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DISCONNECTED = 'disconnected',
}

export enum EDatabaseMode {
  SINGLE = 'single',
  MULTI_SCHEMA = 'multi-schema',
  MULTI_DATABASE = 'multi-database',
}
