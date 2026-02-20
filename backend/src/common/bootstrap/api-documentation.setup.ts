import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { LoggerService } from '../logger/logger.service';

export function setupApiDocumentation(
  app: INestApplication,
  configService: ConfigService,
  loggerService: LoggerService,
) {
  const port = configService.get<number>('app.port', 3000);

  // API documentation with Scalar
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Customer App Web API')
      .setDescription(
        'Empower coaches to manage clients, track progress, and deliver results — all in one simple, powerful tool.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
        },
        'access-token',
      )
      .addServer('/api', 'Local API')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const scalarConfig = configService.get('scalar');
    const title = scalarConfig?.title || 'Customer App Web API';
    const description =
      scalarConfig?.description ||
      'Empower coaches to manage clients, track progress, and deliver results — all in one simple, powerful tool.';
    app.use(
      '/api/scalar-docs',
      apiReference({
        content: document,
        routePrefix: '/api',
        title: title,
        meta: {
          description: description,
        },
      }),
    );

    // Also keep the JSON endpoint for external tools
    SwaggerModule.setup('api/swagger-docs', app, document);

    // 4️⃣ Express-only JSON endpoint (safe)
    const httpAdapter = app.getHttpAdapter();

    if (httpAdapter.getType() === 'express') {
      const instance = httpAdapter.getInstance();
      instance.get('/api/docs-json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(document);
      });
    }

    loggerService.log(
      `🚀 Scalar API documentation available at: http://localhost:${port}/api/docs`,
    );
    loggerService.log(
      `📄 OpenAPI JSON available at: http://localhost:${port}/api/docs-json`,
    );
  }
}
