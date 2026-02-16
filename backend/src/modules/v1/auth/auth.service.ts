import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

import { IMessageResponse } from '@shared/interfaces';
import {
  ResetPasswordWithTokenDto,
  SignupDto,
} from '@shared/dtos';
import { UsersService } from '../users/users.service';
import { LoggerService } from '@/common/logger/logger.service';
import { ActivityLogsService } from '@/common/activity-logs/activity-logs.service';
import {
  EActivityType,
  EActivityStatus,
} from '@shared/enums/activity-log.enum';
import { RewardsService } from '@/modules/v1/rewards/rewards.service';
import { MembersService } from '../members/members.service';
import { SignupUserLevel } from '@shared/enums/user.enum';
import { User } from '@/common/base-user/entities/user.entity';
import { PasswordResetEmailService } from './services/password-reset-email.service';

@Injectable()
export class AuthService {
  private readonly logger = new LoggerService(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
    private readonly memberService: MembersService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly rewardsService: RewardsService,
    private readonly passwordResetEmailService: PasswordResetEmailService,
  ) { }

  async signup(signupDto: SignupDto, tenantId: string | null = null): Promise<{ message: string, user: User }> {
    try {
      const { referralCode, ...userData } = signupDto;

      // Determine level: if tenantId exists, it's a subdomain request (MEMBER), otherwise ADMIN
      const level: SignupUserLevel = tenantId ? SignupUserLevel.MEMBER : SignupUserLevel.SUPER_ADMIN;

      let user: User;



      if (level === SignupUserLevel.MEMBER) {
        try {
          const res = await this.memberService.createMember({
            user: userData,
          });
          user = res.member.user;
        } catch (error) {
          this.logger.error(
            'Failed to create member record after signup',
            error instanceof Error ? error.stack : String(error),
          );
          throw error;
        }
      } else {
        const res = await this.userService.createUser({
          ...userData,
          isActive: true,
          level,
        });
        user = res.user;
      }

      if (referralCode && user) {
        await this.rewardsService.processReferralSignup(user.id, referralCode);
      }

      // Log successful signup activity
      await this.activityLogsService.createActivityLog({
        description: `User registered successfully: ${signupDto.email}`,
        type: EActivityType.SIGNUP,
        status: EActivityStatus.SUCCESS,
        endpoint: '/api/auth/signup',
        method: 'POST',
        statusCode: 201,
        metadata: {
          email: signupDto.email,
          firstName: signupDto.firstName,
          lastName: signupDto.lastName,
          referralCode: referralCode || null,
          timestamp: new Date().toISOString(),
        },
      });

      return { message: 'Registration successful', user };
    } catch (error) {
      // Log failed signup activity
      await this.activityLogsService.createActivityLog({
        description: `Failed to register user: ${signupDto.email}`,
        type: EActivityType.SIGNUP,
        status: EActivityStatus.FAILED,
        endpoint: '/api/auth/signup',
        method: 'POST',
        statusCode: 400,
        metadata: {
          email: signupDto.email,
          timestamp: new Date().toISOString(),
        },
        errorMessage: error instanceof Error ? error.message : String(error),
        userId: undefined,
      });

      throw error;
    }
  }


  async validateUser(email: string, clientPassword: string): Promise<any> {
    try {
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        // Log failed login attempt
        await this.activityLogsService.createActivityLog({
          description: `Failed login attempt: ${email}`,
          type: EActivityType.LOGIN,
          status: EActivityStatus.FAILED,
          endpoint: '/api/auth/login',
          method: 'POST',
          statusCode: 401,
          metadata: {
            email,
            reason: 'User not found',
            timestamp: new Date().toISOString(),
          },
          errorMessage: 'Invalid credentials',
          userId: undefined,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.password) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(clientPassword, user.password);

      if (!isMatch) {
        // Log failed login attempt
        await this.activityLogsService.createActivityLog({
          description: `Failed login attempt: ${email}`,
          type: EActivityType.LOGIN,
          status: EActivityStatus.FAILED,
          endpoint: '/api/auth/login',
          method: 'POST',
          statusCode: 401,
          metadata: {
            email,
            reason: 'Invalid password',
            timestamp: new Date().toISOString(),
          },
          errorMessage: 'Invalid credentials',
          userId: user.id,
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        // Log failed login attempt
        await this.activityLogsService.createActivityLog({
          description: `Failed login attempt: ${email}`,
          type: EActivityType.LOGIN,
          status: EActivityStatus.FAILED,
          endpoint: '/api/auth/login',
          method: 'POST',
          statusCode: 401,
          metadata: {
            email,
            reason: 'Account inactive',
            timestamp: new Date().toISOString(),
          },
          errorMessage: 'User account is inactive',
          userId: user.id,
        });
        throw new UnauthorizedException('User account is inactive');
      }

      const token = this.jwtService.sign(
        {
          email: user.email,
          purpose: 'otp',
        },
        {
          expiresIn: '1d',
        },
      );

      const { password, ...userWithoutPassword } = user;

      // Log successful login activity
      await this.activityLogsService.createActivityLog({
        description: `User logged in successfully: ${email}`,
        type: EActivityType.LOGIN,
        status: EActivityStatus.SUCCESS,
        endpoint: '/api/auth/login',
        method: 'POST',
        statusCode: 200,
        metadata: {
          email,
          userId: user.id,
          timestamp: new Date().toISOString(),
        },
      });

      return { token, user: userWithoutPassword };
    } catch (error) {
      // Re-throw the error if it's already an UnauthorizedException
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Log unexpected error
      await this.activityLogsService.createActivityLog({
        description: `Login error: ${email}`,
        type: EActivityType.LOGIN,
        status: EActivityStatus.FAILED,
        endpoint: '/api/auth/login',
        method: 'POST',
        statusCode: 500,
        metadata: {
          email,
          timestamp: new Date().toISOString(),
        },
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  async sendResetLink(
    email: string,
    tenantId: string | null = null,
  ): Promise<{ message: string }> {
    try {
      const user = await this.userService.getUserByEmail(email);

      if (user) {
        const appConfig = this.configService.get('app');

        const token = this.jwtService.sign({
          id: user.id,
          tenantId: tenantId,
          purpose: 'password_reset',
          expiresIn: '15m',
        });

        // Use the origin from request if provided, otherwise fallback to config
        const appUrl = appConfig.appUrl;
        const resetPasswordPath = appConfig.passwordResetPath;
        const resetUrl = `${appUrl}/${resetPasswordPath}?token=${token}`;

        try {
          await this.passwordResetEmailService.sendPasswordResetLink(
            user,
            resetUrl,
          );

          // Log successful password reset request
          await this.activityLogsService.createActivityLog({
            description: `Password reset link sent successfully: ${email}`,
            type: EActivityType.FORGOT_PASSWORD,
            status: EActivityStatus.SUCCESS,
            endpoint: '/api/auth/forgot-password',
            method: 'POST',
            statusCode: 200,
            metadata: {
              email,
              userId: user.id,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (error) {
          this.logger.error(
            'Error sending reset email',
            error instanceof Error ? error.stack : String(error),
          );

          // Log failed password reset request
          await this.activityLogsService.createActivityLog({
            description: `Failed to send password reset link: ${email}`,
            type: EActivityType.FORGOT_PASSWORD,
            status: EActivityStatus.FAILED,
            endpoint: '/api/auth/forgot-password',
            method: 'POST',
            statusCode: 500,
            metadata: {
              email,
              userId: user.id,
              timestamp: new Date().toISOString(),
            },
            errorMessage:
              error instanceof Error ? error.message : String(error),
          });

          throw new HttpException(
            'Failed to send reset email. Please try again later.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        // Log password reset request for non-existent user
        await this.activityLogsService.createActivityLog({
          description: `Password reset requested for non-existent email: ${email}`,
          type: EActivityType.FORGOT_PASSWORD,
          status: EActivityStatus.SUCCESS,
          endpoint: '/api/auth/forgot-password',
          method: 'POST',
          statusCode: 200,
          metadata: {
            email,
            timestamp: new Date().toISOString(),
          },
        });
      }

      return {
        message:
          'If an account with this email exists, a reset link has been sent',
      };
    } catch (error) {
      // Log unexpected error
      await this.activityLogsService.createActivityLog({
        description: `Password reset request error: ${email}`,
        type: EActivityType.FORGOT_PASSWORD,
        status: EActivityStatus.FAILED,
        endpoint: '/api/auth/forgot-password',
        method: 'POST',
        statusCode: 500,
        metadata: {
          email,
          timestamp: new Date().toISOString(),
        },
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  async resetPassword(
    resetDta: ResetPasswordWithTokenDto,
    tenantId: string | null = null,
  ): Promise<{ message: string }> {
    const { token, password, confirmPassword } = resetDta;

    try {
      let payload;
      try {
        payload = this.jwtService.verify(token);
        if (payload.tenantId !== tenantId) {
          throw new Error('Invalid tenant');
        }
      } catch (e) {
        // Log failed password reset due to invalid token
        await this.activityLogsService.createActivityLog({
          description: `Failed password reset attempt - invalid token`,
          type: EActivityType.RESET_PASSWORD,
          status: EActivityStatus.FAILED,
          endpoint: '/api/auth/reset-password',
          method: 'POST',
          statusCode: 400,
          metadata: {
            timestamp: new Date().toISOString(),
          },
          errorMessage: 'Invalid or expired token',
        });
        throw new BadRequestException('Invalid or expired token');
      }

      const result = await this.userService.resetPassword(
        payload.id,
        { password, confirmPassword },
        true,
      );

      // Log successful password reset
      await this.activityLogsService.createActivityLog({
        description: `Password reset successfully for user ID: ${payload.id}`,
        type: EActivityType.RESET_PASSWORD,
        status: EActivityStatus.SUCCESS,
        endpoint: '/api/auth/reset-password',
        method: 'POST',
        statusCode: 200,
        metadata: {
          userId: payload.id,
          timestamp: new Date().toISOString(),
        },
      });

      return result;
    } catch (error) {
      // Log failed password reset
      await this.activityLogsService.createActivityLog({
        description: `Failed password reset attempt`,
        type: EActivityType.RESET_PASSWORD,
        status: EActivityStatus.FAILED,
        endpoint: '/api/auth/reset-password',
        method: 'POST',
        statusCode: 400,
        metadata: {
          timestamp: new Date().toISOString(),
        },
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}
