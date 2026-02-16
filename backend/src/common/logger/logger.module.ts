import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerService } from './logger.service';
import { LoggerInterceptor } from './interceptors/logger.interceptor';

@Global()
@Module({
  providers: [
    LoggerService,
    LoggerInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
