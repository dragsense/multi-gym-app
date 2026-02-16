import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';

export default registerAs('mailer', () => ({
  from: process.env.MAIL_FROM,
  adminEmail: process.env.MAIL_ADMIN_EMAIL,
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  user: process.env.MAIL_USER,
  pass: process.env.MAIL_PASS,
  dkimSelector: process.env.MAIL_DKIM_SELECTOR || 'default',
  dkimPrivateKeyPath:
    process.env.MAIL_DKIM_PRIVATE_KEY_PATH || '/root/private.key',
}));

export const getMailerConfig = async (
  configService: ConfigService,
): Promise<MailerOptions> => {
  const isDev = process.env.NODE_ENV === 'development';

  const transport: any = {
    host: configService.get<string>('mailer.host'),
    port: configService.get<number>('mailer.port'),
    secure: !isDev && configService.get<number>('mailer.port') === 465,
    auth: !isDev
      ? {
        user: configService.get<string>('mailer.user'),
        pass: configService.get<string>('mailer.pass'),
      }
      : undefined,
  };

  if (isDev) {
    transport.ignoreTLS = true; // disable TLS in dev
  }

  // ✅ Only add DKIM if not in development
  if (!isDev) {
    transport.dkim = {
      domainName: 'paybackbilling.com',
      keySelector:
        configService.get<string>('mailer.dkimSelector') || 'default',
      privateKey: fs.readFileSync(
        path.resolve(
          configService.get<string>('mailer.dkimPrivateKeyPath') ||
          '/root/private.key',
        ),
        'utf8',
      ),
    };
  }

  return {
    transport,
    defaults: {
      from: `"${configService.get<string>('app.name')}" <${configService.get<string>('mailer.from')}>`,
    },
  };
};
