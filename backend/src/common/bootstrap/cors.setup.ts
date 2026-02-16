import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Extract main domain from URL
 * e.g., 'http://example.com' -> 'example.com'
 * e.g., 'http://localhost:5173' -> 'localhost'
 */
function extractMainDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Check if origin is a subdomain of the main domain
 */
function isSubdomainOf(origin: string, mainDomain: string): boolean {
  if (!origin || !mainDomain) return false;
  
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.hostname.toLowerCase();
    const mainHost = mainDomain.toLowerCase();
    
    // If it's localhost or IP, don't treat as subdomain
    if (originHost === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(originHost)) {
      return false;
    }
    
    // Check if origin host ends with main domain
    // e.g., 'mygym.example.com' ends with 'example.com'
    return originHost.endsWith(`.${mainHost}`) || originHost === mainHost;
  } catch {
    return false;
  }
}

export function setupCors(app: INestApplication, configService: ConfigService) {
  // CORS configuration
  const corsOriginsConfig = configService
    .get<string>('app.corsOrigins', 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim());
  
  // Extract main domains from configured origins
  const mainDomains = corsOriginsConfig
    .map(extractMainDomain)
    .filter((domain): domain is string => domain !== null);
  
  // CORS origin function to allow configured origins and all subdomains
  const originFunction = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in the configured list
    if (corsOriginsConfig.includes(origin)) {
      return callback(null, true);
    }
    
    // Check if origin is a subdomain of any main domain
    const isAllowedSubdomain = mainDomains.some(mainDomain => 
      isSubdomainOf(origin, mainDomain)
    );
    
    if (isAllowedSubdomain) {
      return callback(null, true);
    }
    
    // Reject origin
    callback(null, false);
  };
  
  app.enableCors({
    origin: originFunction,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Timezone',
    ],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    maxAge: 3600,
  });
}
