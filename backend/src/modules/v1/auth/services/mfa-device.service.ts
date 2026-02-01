import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { OtpService } from './otp.service';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';
import { TrustedDevice } from '@/modules/v1/auth/entities/trusted-device.entity';
import { User } from '@/common/base-user/entities/user.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { EmailTemplateService } from '@/common/email/email-template.service';

@Injectable()
export class MfaService {
  private readonly logger = new LoggerService(MfaService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly entityRouterService: EntityRouterService,
    private readonly emailTemplateService: EmailTemplateService,
  ) { }

  async generateEmailOtp(email: string, deviceId?: string): Promise<string> {
    const userRepo = this.entityRouterService.getRepository<User>(User);
    const user = await userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const otp = await this.otpService.initiateLoginOtp(user, deviceId);
    await this.sendOtpEmail(email, otp);
    this.logger.log(`OTP generated and sent to ${email}`);
    return otp;
  }

  verifyOtpToken(token: string): { email: string } {
    let payload;
    try {
      payload = this.jwtService.verify(token);
      this.logger.debug(`OTP token verified successfully for ${payload.email}`);
    } catch (e) {
      this.logger.warn(`Invalid or expired OTP token`);
      throw new BadRequestException('Invalid or expired token');
    }
    return { email: payload.email };
  }

  async verifyOtp(
    token: string,
    code: string,
    deviceId?: string,
    rememberDevice?: boolean,
    reqMeta?: { userAgent?: string; ipAddress?: string },
  ): Promise<{ isValid: boolean; email: string; }> {
    const { email } = this.verifyOtpToken(token);
    const userRepo = this.entityRouterService.getRepository<User>(User);
    const user = await userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await this.otpService.verifyOtp(user, code);

    if (isValid) {
      this.logger.log(`OTP successfully verified for ${email}`);

      if (rememberDevice && deviceId) {
        const trustedDeviceRepo = this.entityRouterService.getRepository<TrustedDevice>(TrustedDevice);
        const exists = await trustedDeviceRepo.findOne({
          where: { user: { id: user.id } as any, deviceId },
        });
        if (!exists) {
          await trustedDeviceRepo.save(
            trustedDeviceRepo.create({
              user,
              deviceId,
              deviceName: undefined,
              userAgent: reqMeta?.userAgent || null,
              ipAddress: reqMeta?.ipAddress || null,
            }),
          );
        }
      }
    } else {
      this.logger.warn(`Failed OTP verification for ${email}`);
    }

    return { isValid, email };
  }

  async isDeviceTrusted(userId: string, deviceId?: string): Promise<boolean> {
    if (!deviceId) return false;
    const trustedDeviceRepo = this.entityRouterService.getRepository<TrustedDevice>(TrustedDevice);
    const exists = await trustedDeviceRepo.findOne({
      where: { user: { id: userId } as any, deviceId },
    });

    this.logger.debug(
      `Device check for user ${userId}, deviceId=${deviceId}: ${exists ? 'trusted' : 'not trusted'}`,
    );

    return !!exists;
  }

  async removeAllDevices(userId?: string): Promise<void> {
    if (!userId) return;
    const trustedDeviceRepo = this.entityRouterService.getRepository<TrustedDevice>(TrustedDevice);
    await trustedDeviceRepo.delete({ user: { id: userId } as any });
    await this.otpService.removeAllUserOtp(userId);
  }

  private async sendOtpEmail(to: string, otp: string): Promise<void> {
    const appName = this.configService.get<string>('app.name');
    const from = this.configService.get<string>('mailer.from');

    try {
      const html = this.emailTemplateService.generateHTML({
        title: 'One-Time Password (OTP)',
        greeting: 'Hello',
        content: `
          <p>Use the following One-Time Password (OTP) to complete your login:</p>
          <div class="info-box" style="text-align: center; padding: 24px;">
            <code style="font-size: 28px; font-weight: 600; letter-spacing: 8px; padding: 16px 24px; display: inline-block; background-color: #ffffff; border: 2px solid #e0e0e0;">${otp}</code>
          </div>
          <p>This code will expire in <strong>5 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
        `,
        footerNote: 'This is an automated security email. Please do not reply to this message.',
        appName,
      });

      const text = this.emailTemplateService.generateText({
        title: 'One-Time Password (OTP)',
        greeting: 'Hello',
        content: `
Use the following One-Time Password (OTP) to complete your login:

${otp}

This code will expire in 5 minutes. If you did not request this code, you can safely ignore this email.

This is an automated security email. Please do not reply to this message.
        `,
        appName,
      });

      await this.mailerService.sendMail({
        to,
        from,
        subject: `${appName} - One-Time Password (OTP)`,
        html,
        text,
      });

      this.logger.log(`OTP email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}`, error.stack);
      throw new Error('Unable to send OTP email at this time.');
    }
  }
}
