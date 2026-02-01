import { registerAs } from '@nestjs/config';

export default registerAs('cluster', () => ({
  enabled: process.env.CLUSTER_ENABLED === 'true',
}));
