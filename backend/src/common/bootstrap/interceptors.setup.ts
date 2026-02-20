import { INestApplication } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { ResponseEncryptionInterceptor } from '../../interceptors/response-encryption-interceptor';
import { BrowserHtmlInterceptor } from '../../interceptors/browser-html-interceptor';
import { RequestContextInterceptor } from '../context/request-context.interceptor';

import { NestInterceptor } from '@nestjs/common';

export function setupInterceptors(
  app: INestApplication,
  loggerService: LoggerService,
) {
  const requestContextInterceptor = app.get(RequestContextInterceptor);

  const interceptors: NestInterceptor[] = [
    requestContextInterceptor,
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
