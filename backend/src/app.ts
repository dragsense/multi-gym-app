import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisIoAdapter } from './common/gateways/redis-io.adapter';

import { AppModule } from './app.module';
import { ExceptionsFilter } from './exceptions/exceptions-filter';
import { LoggerService } from './common/logger/logger.service';

// Bootstrap components
import { setupCors } from './common/bootstrap/cors.setup';
import { setupSecurity } from './common/bootstrap/security.middleware';
import { setupApiDocumentation } from './common/bootstrap/api-documentation.setup';
import { setupInterceptors } from './common/bootstrap/interceptors.setup';
import { setupBullBoard } from './common/bootstrap/bull-board.setup';
import { setupRequestContext } from './common/bootstrap/request-context.setup';

export async function app() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService);

  // Use custom logger globally
  const loggerService = app.get(LoggerService);
  loggerService.setContext('Bootstrap');
  app.useLogger(loggerService);

  // Setup application components
  setupCors(app, configService);
  setupRequestContext(app);
  setupSecurity(app, configService);
  setupApiDocumentation(app, configService, loggerService);
  setupInterceptors(app, loggerService);
  setupBullBoard(app, loggerService, configService);

  // Socket.IO adapter (Redis) per Nest WebSockets Adapter docs
  const redisAdapter = new RedisIoAdapter(app, configService);
  await redisAdapter.connectToRedis();
  app.useWebSocketAdapter(redisAdapter);

  // Global filters and pipes
  app.useGlobalFilters(new ExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false },
    }),
  );

  app.setGlobalPrefix('api');

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port, '0.0.0.0');

  loggerService.log(`Application is running on: http://localhost:${port}`);
}
