import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response, Request } from 'express';

@Injectable()
export class BrowserHtmlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const isBrowserNavigation =
      req.method === 'GET' &&
      req.headers['accept']?.includes('text/html') &&
      !req.xhr;

    if (!isBrowserNavigation) {
      return next.handle();
    }

    // 🚀 Browser navigation → wrap any result in styled HTML (like ExceptionFilter)
    return next.handle().pipe(
      map((data) => {
        res.type('html');
        return `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <title>Response</title>
              <style>
                body {
                  font-family: system-ui, sans-serif;
                  text-align: center;
                  padding: 50px;
                  background: #f8f9fa;
                  color: #333;
                }
                h1 {
                  font-size: 2.5em;
                  margin-bottom: 0.5em;
                  color: #007bff;
                }
                p {
                  margin: 0.5em 0;
                }
                pre {
                  background: #272822;
                  color: #f8f8f2;
                  padding: 1em;
                  border-radius: 6px;
                  text-align: left;
                  overflow-x: auto;
                }
                a {
                  color: #007bff;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <h1>Response from ${req.url}</h1>
              <p>Here is the result of your request:</p>
              <pre>${JSON.stringify(data, null, 2)}</pre>
              <p><a href="/">⬅ Go Home</a></p>
            </body>
          </html>
        `;
      }),
    );
  }
}
