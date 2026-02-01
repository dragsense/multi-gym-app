import { Controller, Get, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Public } from './decorators/access.decorator';

@Public()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get API information' })
  @ApiResponse({
    status: 200,
    description: 'API information retrieved successfully',
    schema: {},
  })
  getAppInfo() {
    return this.appService.getAppInfo();
  }

  @Get('csrf-token')
  @ApiOperation({ summary: 'Get CSRF token' })
  getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookieSecret = this.configService.get<string>('app.cookieSecret');

    // Check if CSRF token already exists in cookie
    const existingToken = cookieSecret 
      ? req.signedCookies?.csrfToken 
      : req.cookies?.csrfToken;

    // If token exists, return it without creating a new one
    if (existingToken) {
      return { csrfToken: existingToken };
    }

    // Only create new token if none exists
    const token = crypto.randomBytes(24).toString('hex');

    res.cookie('csrfToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      signed: !!cookieSecret,
    }); 

    return { csrfToken: token };
  }
}
