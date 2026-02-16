import { registerAs } from '@nestjs/config';

export default registerAs('health', () => ({
    pingUrl: process.env.HEALTHCHECK_PING_URL || 'https://www.google.com',
}));
