import { INestApplication,NestInterceptor } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { UserContextInterceptor, BrowserHtmlInterceptor, ResponseEncryptionInterceptor } from '@/interceptors';

export function setupInterceptors(
  app: INestApplication,
  loggerService: LoggerService,
) {
  const userContextInterceptor = app.get(UserContextInterceptor);
  const interceptors: NestInterceptor[] = [
    userContextInterceptor,
    new BrowserHtmlInterceptor(),
  ];

  // Only use encryption in production
  if (process.env.NODE_ENV === 'production') {
    const encryptionInterceptor = app.get(ResponseEncryptionInterceptor);
    interceptors.push(encryptionInterceptor);
    loggerService.log('✅ Encryption interceptor enabled');
  } else {
    loggerService.warn('⚠️ Encryption disabled (development mode)');
  }

  // Note: ActivityLogInterceptor and LoggerInterceptor are registered globally
  // via APP_INTERCEPTOR in their respective modules, not here

  app.useGlobalInterceptors(...interceptors);
}
