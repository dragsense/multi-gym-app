import { registerAs } from '@nestjs/config';

export default registerAs('activityLogs', () => ({
  // Enable/disable activity logging
  enabled: process.env.ACTIVITY_LOGS_ENABLED === 'true',

  // Specific endpoints to log (empty array = log all)
  logEndpoints: ['/api/users', '/api/sessions'],

  // HTTP methods to log
  logMethods: ['POST', 'PUT', 'DELETE', 'PATCH'],

  // Activity types to log
  logActivityTypes: ['create', 'update', 'delete', 'login', 'logout'],
}));
