import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MailerModule } from '@nestjs-modules/mailer';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bull';

import {
  configOptions,
  appConfig,
  cacheConfig,
  healthConfig,
  databaseConfig,
  jwtConfig,
  mailerConfig,
  getMailerConfig,
  platformOwnerConfig,
  clusterConfig,
  activityLogsConfig,
  paymentProcessorsConfig,
  getJwtConfig,
  bullQueueConfig,
  twilioConfig,
  mqttConfig,
  aiProcessorsConfig,
  mediamtxConfig,
} from './config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature modules - exported from modules index
import {
  AIAdapterModule,
  UsersModule,
  AuthModule,
  ChatModule,
  MembersModule,
  StaffModule,

  SessionsModule,
  BillingsModule,
  ReferralLinksModule,
  RewardsModule,
  UserSettingsModule,
  UserAvailabilityModule,
  StripeModule,
  PaysafeModule,
  DashboardModule,
  BusinessModule,
  MembershipsModule,
  AccessFeaturesModule,
  AccessHoursModule,
  CheckinsModule,
  TasksModule,
  AdvertisementsModule,
  LocationsModule,
  DeviceReadersModule,
  FacilityInfoModule,
  TrainerServicesModule,
  ServiceOffersModule,
  CmsModule,
  DoorsModule,
  TicketsModule,
  EquipmentReservationsModule,
  ProductModule,
  CamerasModule,
  StreamsModule,
  AutomationModule,
  CartModule,
  StoreModule,
  OrdersModule,
} from './modules';
import { SeedsModule } from './seeds/seeds.module';

// Common modules - exported from index
import {
  BaseUserModule,
  FileUploadModule,
  ActivityLogsModule,
  WorkerModule,
  LoggerModule,
  DatabaseModule,
  ServerGatewayModule,
  SettingsModule,
  PaymentProcessorsModule,
  ActionModule,
  CacheModule,
  RolesModule,
  HealthModule,
  NotificationModule,
  MqttModule,
  AIProcessorsModule,
} from './common';

import { SubdomainTenantMiddleware, RequestContextMiddleware, TenantMiddleware } from './middlewares';
import { UserContextInterceptor, ResponseEncryptionInterceptor } from './interceptors';

import { join } from 'path';
import { EncryptionService } from './lib/encryption.service';
import { getBullQueueConfig } from './config/bull-queue.config';
import { JwtModule } from '@nestjs/jwt';
import { ProfilesModule } from './modules/v1/users/profiles/profiles.module';
import { JwtAuthGuard, ModuleAccessGuard, BusinessGuard, TenantGuard, UserLevelGuard, UerPermissionGuard } from './guards';





@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      ...configOptions,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        mailerConfig,
        clusterConfig,
        platformOwnerConfig,
        activityLogsConfig,
        paymentProcessorsConfig,
        cacheConfig,
        healthConfig,
        bullQueueConfig,
        twilioConfig,
        mqttConfig,
        aiProcessorsConfig,
        mediamtxConfig,
      ],
      isGlobal: true,
    }),


    // Serve public directory (includes uploads) at root path
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
      exclude: ['/api*'],
      serveStaticOptions: {
        setHeaders: (res, path, stat) => {
          // Set CORS headers for all files - use setHeader for compatibility
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.setHeader('Access-Control-Allow-Credentials', 'true');

          // Disable caching for favicon files to allow dynamic updates
          if (path.endsWith('.ico') || path.includes('favicon')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Content-Type', 'image/x-icon');
          } else {
            // Cache other static files
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      },
    }),



    // Serve frontend static files, excluding API and uploads
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../../../', 'frontend', 'dist'),
    }),


    // Database - Unified System
    DatabaseModule.forRoot(),

    // Email
    MailerModule.forRootAsync({
      useFactory: getMailerConfig,
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 600, // 600 requests per minute
      },
    ]),

    JwtModule.registerAsync({
      useFactory: getJwtConfig,
      inject: [ConfigService],
      global: true,
    }),

    // Events
    EventEmitterModule.forRoot(),

    // Bull Queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getBullQueueConfig,
      inject: [ConfigService],
    }),

    // Common modules
    BaseUserModule,
    LoggerModule,
    ServerGatewayModule,
    NotificationModule,
    FileUploadModule,
    ActivityLogsModule,
    CacheModule,
    WorkerModule,
    HealthModule,
    RolesModule,
    ChatModule,
    MqttModule,
    AIProcessorsModule,
    AIAdapterModule,

    // Feature modules
    MembersModule,
    SessionsModule,
    BillingsModule,
    ReferralLinksModule,
    RewardsModule,
    UserSettingsModule,
    SettingsModule,
    UserAvailabilityModule,
    StripeModule,
    //PaysafeModule,
    SeedsModule,
    UsersModule,
    AuthModule,
    ActionModule,
    DashboardModule,
    BusinessModule,
    ProfilesModule,
    //MembershipsModule,
    //AccessFeaturesModule,
    //AccessHoursModule,
    //CheckinsModule,
    //TasksModule,
    //AdvertisementsModule,
    //LocationsModule,
    //DoorsModule,
    //DeviceReadersModule,
   // FacilityInfoModule,
    //TrainerServicesModule,
    //ServiceOffersModule,
    CmsModule,
    TicketsModule,
    StaffModule,
   // EquipmentReservationsModule,
    //ProductModule,
    //CamerasModule,
    //StreamsModule,
    //AutomationModule,
    //CartModule,
    //StoreModule,
    //OrdersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RequestContextMiddleware,
    TenantMiddleware,
    SubdomainTenantMiddleware,
    EncryptionService,
    UserContextInterceptor,
    ResponseEncryptionInterceptor,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: BusinessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ModuleAccessGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserLevelGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UerPermissionGuard,
    }
  ],
})
export class AppModule { }
