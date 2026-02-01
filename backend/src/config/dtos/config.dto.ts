import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
}

export class EnvironmentVariables {
  // Application
  @IsString()
  APP_NAME: string;

  @IsString()
  APP_URL: string;

  @IsString()
  HOST: string;

  @IsNumber()
  PORT: number;

  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsString()
  @IsOptional()
  APP_LOGIN_PATH: string;

  @IsString()
  @IsOptional()
  APP_PASSWORD_RESET_PATH: string;

  // Database
  @IsString()
  DB_HOST: string;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_USER: string;

  @IsString()
  DB_PASS: string;

  @IsString()
  DB_NAME: string;

  @IsBoolean()
  TYPEORM_SYNCHRONIZE: boolean;

  @IsBoolean()
  TYPEORM_LOGGING: boolean;

  // DB Pool
  @IsNumber()
  @IsOptional()
  DB_POOL_SIZE: number;

  @IsNumber()
  @IsOptional()
  DB_POOL_MAX: number;

  @IsNumber()
  @IsOptional()
  DB_POOL_MIN: number;

  @IsNumber()
  @IsOptional()
  DB_POOL_IDLE: number;

  @IsNumber()
  @IsOptional()
  DB_POOL_CONN_TIMEOUT: number;

  // Database Mode and Advanced Configuration
  @IsString()
  @IsOptional()
  DB_MODE: string;

  @IsString()
  @IsOptional()
  DB_DEFAULT_CONNECTION: string;

  @IsBoolean()
  @IsOptional()
  DB_AUTO_REPLICA: boolean;

  @IsBoolean()
  @IsOptional()
  DB_AUTO_ARCHIVE: boolean;

  // Database Health Check Configuration
  @IsNumber()
  @IsOptional()
  DB_HEALTH_CHECK_INTERVAL: number;

  @IsNumber()
  @IsOptional()
  DB_HEALTH_CHECK_TIMEOUT: number;

  @IsString()
  @IsOptional()
  DB_HEALTH_CHECK_QUERY: string;

  // Database Retry Configuration
  @IsNumber()
  @IsOptional()
  DB_RETRY_MAX_ATTEMPTS: number;

  @IsNumber()
  @IsOptional()
  DB_RETRY_DELAY: number;

  @IsNumber()
  @IsOptional()
  DB_RETRY_BACKOFF_MULTIPLIER: number;

  // JWT
  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  ACCESS_TOKEN_EXPIRY: string;

  @IsString()
  @IsOptional()
  REFRESH_TOKEN_EXPIRY: string;

  @IsNumber()
  @IsOptional()
  REFRESH_TOKEN_CLEANUP_DAYS: number;

  // Mailer
  @IsString()
  MAIL_HOST: string;

  @IsNumber()
  MAIL_PORT: number;

  @IsOptional()
  @IsString()
  MAIL_USER: string;

  @IsOptional()
  @IsString()
  MAIL_PASS: string;

  @IsString()
  MAIL_FROM: string;

  // Encryption
  @IsString()
  @IsOptional()
  ENCRYPTION_KEY: string;

  // OTP
  @IsString()
  @IsOptional()
  OTP_SECRET: string;

  // Cookie
  @IsString()
  @IsOptional()
  COOKIE_SECRET: string;

  // Cors
  @IsString()
  @IsOptional()
  CORS_ORIGINS: string;

  // API Prefix
  @IsString()
  @IsOptional()
  API_PREFIX: string;

  // Cache Configuration
  @IsString()
  @IsOptional()
  CACHE_HOST: string;

  @IsNumber()
  @IsOptional()
  CACHE_PORT: number;

  @IsString()
  @IsOptional()
  CACHE_PASSWORD: string;

  @IsNumber()
  @IsOptional()
  CACHE_DB: number;

  @IsNumber()
  @IsOptional()
  CACHE_DEFAULT_TTL: number;

  @IsNumber()
  @IsOptional()
  CACHE_MAX_ITEMS: number;

  @IsString()
  @IsOptional()
  CACHE_PREFIX: string;

  @IsBoolean()
  @IsOptional()
  CACHE_ENABLED: boolean;

  // Dragonfly Configuration (for Bull Queue)
  @IsString()
  @IsOptional()
  REDIS_HOST: string;

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsNumber()
  @IsOptional()
  REDIS_DB: number;

  // Bull Queue Configuration - Only Dragonfly config is used

  // Cluster Configuration
  @IsBoolean()
  @IsOptional()
  CLUSTER_ENABLED: boolean;

  @IsNumber()
  @IsOptional()
  CLUSTER_WORKERS: number;

  // Health Check Configuration
  @IsString()
  @IsOptional()
  HEALTHCHECK_PING_URL: string;

  // Activity Logs Configuration
  @IsBoolean()
  @IsOptional()
  ACTIVITY_LOGS_ENABLED: boolean;

  // Mailer Configuration
  @IsString()
  @IsOptional()
  MAIL_ADMIN_EMAIL: string;

  @IsString()
  @IsOptional()
  MAIL_DKIM_SELECTOR: string;

  @IsString()
  @IsOptional()
  MAIL_DKIM_PRIVATE_KEY_PATH: string;

  // Encryption Configuration
  @IsString()
  @IsOptional()
  ENCRYPTION_ALGORITHM: string;

  // Platform Owner Configuration
  @IsString()
  @IsOptional()
  PLATFORM_OWNER_EMAIL: string;

  @IsString()
  @IsOptional()
  PLATFORM_OWNER_PASSWORD: string;

  @IsString()
  @IsOptional()
  PLATFORM_OWNER_FIRST_NAME: string;

  @IsString()
  @IsOptional()
  PLATFORM_OWNER_LAST_NAME: string;

  // Stripe Configuration
  @IsOptional()
  @IsString()
  STRIPE_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_PUBLISHABLE_KEY?: string;

  @IsOptional()
  @IsString()
  STRIPE_WEBHOOK_SECRET?: string;

  // SRS (Simple Realtime Server) Configuration
  @IsString()
  @IsOptional()
  SRS_HOST: string;

  @IsNumber()
  @IsOptional()
  SRS_RTMP_PORT: number;

  @IsNumber()
  @IsOptional()
  SRS_HTTP_PORT: number;

  @IsNumber()
  @IsOptional()
  SRS_API_PORT: number;

  @IsNumber()
  @IsOptional()
  SRS_RTC_PORT: number;

  @IsString()
  @IsOptional()
  SRS_APP: string;

  @IsString()
  @IsOptional()
  SRS_PUBLIC_HOST: string;

  @IsNumber()
  @IsOptional()
  SRS_PUBLIC_HTTP_PORT: number;

  @IsNumber()
  @IsOptional()
  SRS_PUBLIC_API_PORT: number;

  @IsString()
  @IsOptional()
  SRS_CANDIDATE: string;
}
