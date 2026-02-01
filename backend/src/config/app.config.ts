import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'WEB_API',

  appUrl: process.env.APP_URL || 'http://localhost:5173',
  loginPath: process.env.APP_LOGIN_PATH || 'login',
  passwordResetPath: process.env.APP_PASSWORD_RESET_PATH || 'reset-password',

  host: process.env.HOST || 'localhost',
  port: parseInt(process.env.PORT ?? '3000', 10),
  env: process.env.NODE_ENV || 'development',

  otpSecret: process.env.OTP_SECRET || 'UZm@8grO5s2smT!a',
  cookieSecret: process.env.COOKIE_SECRET || 'UZm@8grO5s2smT!a',

  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:5173',
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'xbe7dpAvSe4mDMyHWIJDy3rUuxxa4Md4zMlay9DSY6A=',
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    saltLength: 64,
    iterations: 100000,
    hash: 'sha512',
    additionalData: 'WEB-API',
  },
  // Bull Board dashboard credentials
  bullBoard: {
    username: process.env.BULL_BOARD_USERNAME || 'admin',
    password: process.env.BULL_BOARD_PASSWORD || 'admin123',
  },
}));
