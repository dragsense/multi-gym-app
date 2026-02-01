import { registerAs } from '@nestjs/config';

import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '15d',
  refreshTokenCleanupDays: parseInt(
    process.env.REFRESH_TOKEN_CLEANUP_DAYS || '30',
    10,
  ),
}));

export const getJwtConfig = async (
  configService: ConfigService,
): Promise<JwtModuleOptions> => ({
  secret: configService.get<string>('jwt.secret'),
  signOptions: {
    expiresIn: configService.get('jwt.accessTokenExpiry'),
  },
});
