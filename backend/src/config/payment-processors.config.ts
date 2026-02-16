import { registerAs } from '@nestjs/config';

const PAYSAFE_BASE_URL_TEST = 'https://api.test.paysafe.com';
const PAYSAFE_BASE_URL_LIVE = 'https://api.paysafe.com';

export default registerAs('paymentProcessors', () => {
  const paysafeEnv = process.env.PAYSAFE_ENVIRONMENT ?? 'TEST';
  const paysafeBaseUrl =
    paysafeEnv === 'LIVE' ? PAYSAFE_BASE_URL_LIVE : PAYSAFE_BASE_URL_TEST;

  return {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    paysafe: {
      apiUsername: process.env.PAYSAFE_API_USERNAME,
      apiPassword: process.env.PAYSAFE_API_PASSWORD,
      environment: paysafeEnv,
      singleUseToken: process.env.PAYSAFE_SINGLE_USE_TOKEN,
      baseUrl: paysafeBaseUrl,
    },
  };
});
