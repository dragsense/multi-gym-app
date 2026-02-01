import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as hpp from 'hpp';
import * as compression from 'compression';
import { csrf } from './csrf';

export function setupSecurity(app: INestApplication, configService: ConfigService) {
  // Security middleware
  const cookieSecret = configService.get('app.cookieSecret');
  app.use(cookieParser(cookieSecret));
  app.use(csrf());
  app.use((req, res, next) => {
    // Skip helmet for static file requests (uploads) to avoid CORS issues
    if (req.path.startsWith('/uploads') || req.path.startsWith('/public')) {
      return next();
    }
    
    // Allow Bull Board to be framed, restrict other routes
    if (req.path.startsWith('/bull-board')) {
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", req.protocol + "://" + req.get('host')],
            frameAncestors: ["'self'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        hidePoweredBy: true,
      })(req, res, next);
    } else {
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", req.protocol + "://" + req.get('host')],
            frameAncestors: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: false, // Disable to allow CORS for static files
        crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
        hidePoweredBy: true,
      })(req, res, next);
    }
  });
  app.use(hpp());
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Allow Bull Board to be embedded in iframes
    if (req.path.startsWith('/bull-board')) {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    } else {
      res.setHeader('X-Frame-Options', 'DENY');
    }
    
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
  app.use(compression());
}
