import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '@/common/logger/logger.service';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private readonly logger = new LoggerService('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const isDevelopment = process.env.NODE_ENV === 'development';

    // Log errors in development only
    if (isDevelopment && exception instanceof Error) {
      //this.logger.error('Exception caught', exception.stack);
    }

    const isBrowserNavigation =
      req.method === 'GET' &&
      req.headers['accept']?.includes('text/html') &&
      !req.xhr;

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract the actual error message properly
    let message: string | string[] = 'Internal Server Error';
    let errorResponse: any = null;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      errorResponse = response;
      
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        message = (response as any).message || (response as any).error || 'Internal Server Error';
      }
    } else if (exception instanceof Error) {
      // In production, hide internal error details
      message = isDevelopment ? exception.message : 'Internal Server Error';
      stack = isDevelopment ? exception.stack : undefined;
    }

    if (isBrowserNavigation) {
      res.status(status).type('html');
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Error ${status}</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
              h1 { font-size: 3em; margin-bottom: 0.5em; color: #dc3545; }
              p { color: #555; margin-bottom: 1em; }
              pre { background: #eee; padding: 1em; border-radius: 5px; text-align: left; }
            </style>
          </head>
          <body>
            <h1>Error ${status}</h1>
            <p>While requesting <code>${req.url}</code></p>
            ${isDevelopment ? `<pre>${JSON.stringify(message, null, 2)}</pre>` : `<p>${typeof message === 'string' ? message : 'An error occurred'}</p>`}
            ${stack && isDevelopment ? `<pre>${stack}</pre>` : ''}
            <p><a href="/api/docs">API Docs</a></p>
          </body>
        </html>
      `);
    }

    // Default JSON error for API clients
    const errorPayload: any = {
      statusCode: status,
      message: message,
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    // Include validation errors if present
    if (errorResponse && typeof errorResponse === 'object' && errorResponse.error) {
      errorPayload.error = errorResponse.error;
    }

    // Include stack trace and additional details only in development
    if (isDevelopment) {
      if (stack) {
        errorPayload.stack = stack;
      }
      if (exception instanceof Error && exception.name) {
        errorPayload.exceptionType = exception.name;
      }
    }

    res.status(status).json(errorPayload);
  }
}
