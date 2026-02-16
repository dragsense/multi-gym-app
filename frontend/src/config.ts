/**
 * Get API URL from current origin/location
 * For localhost: uses port 3000 for API (backend default)
 * For production: uses same origin with /api prefix
 */
const getUrlFromOrigin = (): string => {

  const origin = window.location.origin;
  const hostname = window.location.hostname;
  const port = window.location.port;


  // Check if we're on localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost')) {
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:3000`;
  }

  // For production/subdomain, use same origin with /api prefix
  return `${origin}`;
};

export const config = {
  appName: (import.meta as any).env?.VITE_APP_NAME,
  apiUrl: getUrlFromOrigin() + (import.meta as any).env?.VITE_BASE_API_PREFIX || '/api',
  baseUrl: getUrlFromOrigin(),
  environment: (import.meta as any).env?.VITE_NODE_ENV,
  encryptionKey: (import.meta as any).env?.VITE_ENCRYPTION_KEY,
  encryptionAlgorithm: (import.meta as any).env?.VITE_ENCRYPTION_ALGORITHM,
  stripePublishableKey: (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY,
  mainDomain: (import.meta as any).env?.VITE_MAIN_DOMAIN,
};
