import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from '@/config/database.config';
import { DatabaseManager } from './database-manager.service';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { EntityRouterService } from './entity-router.service';
import { DatabaseConnectionEntity } from './entities/database-connection.entity';
import { SubdomainTenantMiddleware } from './subdomain-tenant.middleware';
import { Business } from '@/modules/v1/business/entities/business.entity';
import { SeedsModule } from '@/seeds/seeds.module';

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ConfigModule,
        // Main TypeORM connection for backward compatibility
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: getTypeOrmConfig,
        }),
        // Register DatabaseConnectionEntity and Business (for subdomain middleware)
        TypeOrmModule.forFeature([DatabaseConnectionEntity, Business]),
        // Import SeedsModule to access SeedRunnerService
        SeedsModule,
      ],
      controllers: [DatabaseController],
      providers: [
        DatabaseManager,
        DatabaseService,
        EntityRouterService,
        SubdomainTenantMiddleware,
      ],
      exports: [
        DatabaseManager,
        DatabaseService,
        EntityRouterService,
        SubdomainTenantMiddleware,
        TypeOrmModule,
      ],
    };
  }

  static forFeature(entities: any[]): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forFeature(entities),
      ],
      exports: [TypeOrmModule],
    };
  }
}
