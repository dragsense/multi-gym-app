import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Req,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { SkipBusinessCheck } from '@/decorators/skip-business-check.decorator';

import { Request, Response } from 'express';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

import {
  LoginDto,
  LoginResponseDto,
  SignupDto,
  ForgotPasswordDto,
  ResetPasswordWithTokenDto,
  RefreshTokenResponseDto,
  VerifyOtpDto,
  MessageResponseDto,
  ValidateImpersonationTokenDto,
} from '@shared/dtos';

import { AuthService } from './auth.service';
import { JwtRefreshGuard } from '@/guards/jwt.gaurd';
import { TokenService } from './services/tokens.service';
import { MfaService } from './services/mfa-device.service';
import { ActivityLogsService } from '@/common/activity-logs/activity-logs.service';
import {
  EActivityType,
  EActivityStatus,
} from '@shared/enums/activity-log.enum';
import { Private, Public } from '@/decorators/access.decorator';
import { BaseUsersService } from '@/common/base-user/base-users.service';
import { User } from '@/common/base-user/entities/user.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { JwtService } from '@nestjs/jwt';
import { BusinessSubscriptionService } from '../business/services/business-subscription.service';
import { BusinessService } from '../business/business.service';
import { RequestContext } from '@/common/context/request-context';
import { Business } from '../business/entities/business.entity';

@Public()
@ApiTags('Auth')
@Controller('auth')
@SkipBusinessCheck()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly mfaService: MfaService,
    private readonly baseUsersService: BaseUsersService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly jwtService: JwtService,
    private readonly businessSubscriptionService: BusinessSubscriptionService,
    private readonly businessService: BusinessService,
  ) { }

  @ApiOperation({
    summary: 'User login',
    description: 'Logs in a user and send OTP code',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: any, @Res() res: Response) {
    const { email, password, deviceId } = loginDto;

    let { user, token } = await this.authService.validateUser(
      email,
      password,
    );

    const trusted = await this.mfaService.isDeviceTrusted(user.id, deviceId);

    if (trusted || process.env.NODE_ENV === 'development') {
      const { accessToken, refreshToken } =
        await this.tokenService.generateTokens({
          id: user.id,
          tokenVersion: user.tokenVersion,
          isActive: user.isActive,
        });

      if (!accessToken || !refreshToken) {
        throw new UnauthorizedException('Invalid credentials');
      }

      res.cookie('refresh_token', refreshToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: refreshToken.expiresIn * 1000,

      });

      res.setHeader('Authorization', `Bearer ${accessToken.token}`);


      return res.status(HttpStatus.OK).json({
        accessToken,
        message: 'Logged in successfully',
        requiredOtp: false,
      });
    }

    await this.mfaService.generateEmailOtp(user.email, deviceId);

    return res.status(HttpStatus.OK).json({
      accessToken: { token },
      requiredOtp: true,
      message: 'OTP sent successfully',
    });
  }

  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Generates new access and refresh tokens using a valid refresh token',
  })
  @ApiBody({ type: RefreshTokenResponseDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
  })
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refreshTokens(@Req() req: any, @Res() res: Response) {
    const { refreshToken: oldRefreshToken } = req.user;

    if (!oldRefreshToken) throw new UnauthorizedException('Invalid token');

    const { accessToken, refreshToken } =
      await this.tokenService.refreshTokens(oldRefreshToken);

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    res.cookie('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshToken.expiresIn * 1000,

    });

    res.setHeader('Authorization', `Bearer ${accessToken.token}`);

    return res
      .status(HttpStatus.OK)
      .json({ accessToken, refreshToken, message: 'Logged in successfully' });
  }

  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 204,
    description: 'User registered successfully.',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 409, description: 'The email is already taken' })
  @Post('signup')
  async signup(@Body() signupDto: SignupDto, @Req() req: Request, @Res() res: Response) {
    // Get tenantId from request (set by SubdomainTenantMiddleware)
    const tenantId = (req as any).tenantId || null;

    const { message, user } = await this.authService.signup(signupDto, tenantId);

    const token = this.jwtService.sign(
      {
        email: user.email,
        purpose: 'otp',
      },
      {
        expiresIn: '1d',
      },
    );
    await this.mfaService.generateEmailOtp(user.email, 'signup');

    return res.status(HttpStatus.OK).json({
      token,
      requiredOtp: true,
      message: message,
    });
  }

  @Get('me')
  @Private()
  @ApiOperation({ summary: 'Get user of the authenticated user' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findMe(@AuthUser() currentUser: User) {
    const user = await this.baseUsersService.getSingle(currentUser.id, {
      _relations: ['roles.role', 'permissions.permission', 'privileges.permissions.permission'],
      _select: ['id', 'email', 'firstName', 'lastName','gender','dateOfBirth', 'level', 'roles.id', 'roles.role.name', 'permissions.id', 'permissions.permission.name', 'privileges.id', 'privileges.permissions.id', 'privileges.permissions.permission.name'],
    });
    if (!user) throw new NotFoundException('User not found');


    // Get business subscription features if user has a business
    let subscriptionFeatures: string[] = [];
    try {
      let business: Business | null = null;
      const businessId = RequestContext.get<string>('businessId');

      if (businessId) {
        business = await this.businessService.getSingle(businessId);
      } else {
        business = await this.businessService.getMyBusiness(currentUser);
      }

      if (business) {
        subscriptionFeatures = await this.businessSubscriptionService.getBusinessFeatures(business.id);

      }
    } catch (error) {
      // If business not found or error, features will be empty array
      subscriptionFeatures = [];
    }

    return {
      ...user,
      subscriptionFeatures,
    };
  }

  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out the user by clearing the authentication cookie',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
    type: MessageResponseDto,
  })
  @Private()
  @Post('logout')
  async logout(@Req() req: any, @Res() res: Response) {
    const token = req.user.token;
    const userId = req.user.id;
    const userEmail = req.user.email;

    try {
      await this.tokenService.invalidateToken(token);
    } catch (err) {
      // Log failed logout activity
      await this.activityLogsService.create({
        description: `Failed to logout user: ${userEmail}`,
        type: EActivityType.LOGOUT,
        status: EActivityStatus.FAILED,
        endpoint: '/api/auth/logout',
        method: 'POST',
        statusCode: 500,
        metadata: {
          email: userEmail,
          userId,
          timestamp: new Date().toISOString(),
        },
        errorMessage: err.message,
        userId,
      });
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',

    });

    res.setHeader('Authorization', '');

    // Log successful logout activity
    await this.activityLogsService.create({
      description: `User logged out successfully: ${userEmail}`,
      type: EActivityType.LOGOUT,
      status: EActivityStatus.SUCCESS,
      endpoint: '/api/auth/logout',
      method: 'POST',
      statusCode: 200,
      metadata: {
        email: userEmail,
        userId,
        timestamp: new Date().toISOString(),
      },
      userId,
    });

    return res.status(HttpStatus.OK).json({ message: 'Logged out successful' });
  }

  @ApiOperation({ summary: 'Logout from all devices' })
  @Private()
  @Post('logout-all')
  async logoutAll(@Req() req: any, @Res() res: Response) {
    const userId = req.user.id;
    try {
      await this.tokenService.invalidateAllTokens(userId);
      await this.mfaService.removeAllDevices(userId);
    } catch (err) { }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',

    });
    res.setHeader('Authorization', '');
    return res
      .status(HttpStatus.OK)
      .json({ message: 'Logged out from all devices' });
  }

  @Post('send-reset-link')
  @ApiOperation({ summary: 'Request password reset link via email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description:
      'If an account with this email exists, a reset link has been sent',
    type: MessageResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const tenantId = (req as any).tenantId || null;
    return this.authService.sendResetLink(dto.email, tenantId);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using reset token from email' })
  @ApiBody({ type: ResetPasswordWithTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async setNewPassword(@Body() resetDto: ResetPasswordWithTokenDto, @Req() req: Request) {
    const tenantId = (req as any).tenantId || null;
    return this.authService.resetPassword(resetDto, tenantId);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: any, @Res() res: Response) {
    const { token, code, deviceId, rememberDevice } = dto;

    const { isValid, email } = await this.mfaService.verifyOtp(
      token,
      code,
      deviceId,
      rememberDevice,
      {
        userAgent: (res.req as any)?.headers?.['user-agent'],
        ipAddress: (res.req as any)?.ip,
      },
    );

    if (!isValid) {
      throw new HttpException('Invalid OTP', HttpStatus.UNAUTHORIZED);
    }

    const user = await this.baseUsersService.getSingle({ email: email });

    if (!user) throw new NotFoundException('User not found');

    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens({
        id: user.id,
        isActive: user.isActive,
      });

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    res.cookie('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshToken.expiresIn * 1000,

    });

    res.setHeader('Authorization', `Bearer ${accessToken.token}`);

    // If user is not verified, mark as verified
    if (!user.isVerified) {
      user.isVerified = true;
      await this.baseUsersService.update(user.id, { isVerified: true });
    }

    return res
      .status(HttpStatus.OK)
      .json({ accessToken, message: 'Logged in successfully' });
  }

  @ApiOperation({
    summary: 'Resend OTP',
    description:
      'Resends an OTP code to the user email if still valid, otherwise generates a new one',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
      required: ['token'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP resent or newly generated',
  })
  @Post('resend-otp')
  async resendOtp(@Body() dto: { token: string; deviceId?: string }) {
    const { token, deviceId } = dto;

    const { email } = this.mfaService.verifyOtpToken(token);

    await this.mfaService.generateEmailOtp(email, deviceId);
    return { message: 'New OTP generated and sent successfully' };
  }

  @ApiOperation({
    summary: 'Validate impersonation token and login',
    description: 'Validates an impersonation token and returns access/refresh tokens for the target user',
  })
  @ApiBody({ type: ValidateImpersonationTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Impersonation successful, returns access token',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired impersonation token',
  })
  @Post('impersonate')
  async validateImpersonation(
    @Body() dto: ValidateImpersonationTokenDto,
    @Res() res: Response,
  ) {
    const { token } = dto;

    // Validate the impersonation token
    const decoded = this.tokenService.validateImpersonationToken(token);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired impersonation token');
    }

    const user = await this.baseUsersService.getSingle(decoded.targetUserId);
    if (!user) {
      throw new NotFoundException('Target user not found');
    }

    // Generate real tokens for the target user
    const { accessToken, refreshToken } = await this.tokenService.generateTokens({
      id: user.id,
      isActive: user.isActive,
    });

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('Failed to generate tokens');
    }

    // Set cookies
    res.cookie('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshToken.expiresIn * 1000,
    });

    res.setHeader('Authorization', `Bearer ${accessToken.token}`);

    return res.status(HttpStatus.OK).json({
      accessToken,
      message: 'Impersonation login successful',
      requiredOtp: false,
    });
  }
}
