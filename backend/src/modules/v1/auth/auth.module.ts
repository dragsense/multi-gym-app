import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy, RefreshJwtStrategy } from './strategies/jwt.strategy';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UsersModule } from '@/modules/v1/users/users.module';
import { TokenService } from './services/tokens.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '@/modules/v1/auth/entities/tokens.entity';
import { MfaService } from './services/mfa-device.service';
import { OtpService } from './services/otp.service';
import { TrustedDevice } from '@/modules/v1/auth/entities/trusted-device.entity';
import { OtpCode } from '@/modules/v1/auth/entities/otp-code.entity';
import { ActivityLogsModule } from '@/common/activity-logs/activity-logs.module';
import { RewardsModule } from '@/modules/v1/rewards/rewards.module';
import { MembersModule } from '@/modules/v1/members/members.module';
import { BaseUserModule } from '@/common/base-user/base-users.module';
import { User } from '@/common/base-user/entities/user.entity';
import { BusinessModule } from '@/modules/v1/business/business.module';
import { PasswordResetEmailService } from './services/password-reset-email.service';
import { EmailTemplateService } from '@/common/email/email-template.service';
import { Business } from '@/modules/v1/business/entities/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, User, TrustedDevice, OtpCode, Business]),
    UsersModule,
    ActivityLogsModule,
    RewardsModule,
    PassportModule,
    MembersModule,
    BaseUserModule,
    BusinessModule,
  ],
  exports: [TokenService, JwtStrategy],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshJwtStrategy,
    TokenService,
    MfaService,
    OtpService,
    PasswordResetEmailService,
    EmailTemplateService,
  ],
})
export class AuthModule { }
