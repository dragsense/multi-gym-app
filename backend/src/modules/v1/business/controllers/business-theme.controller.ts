import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { OmitType } from '@shared/lib/type-utils';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { BusinessThemeService } from '../services/business-theme.service';
import { BusinessTheme } from '../entities/business-theme.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { SkipBusinessCheck } from '@/decorators/skip-business-check.decorator';
import { CreateBusinessThemeDto } from '@shared/dtos/business-dtos/business-theme.dto';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { Public } from '@/decorators/access.decorator';
import { UsersService } from '@/modules/v1/users/users.service';
import { TokenService } from '@/modules/v1/auth/services/tokens.service';

@ApiBearerAuth('access-token')
@ApiTags('Business Theme')
@MinUserLevel(EUserLevels.SUPER_ADMIN)
@Controller('business-theme')
export class BusinessThemeController {
  constructor(
    private readonly businessThemeService: BusinessThemeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) { }

  @ApiOperation({ summary: 'Get current business theme' })
  @ApiResponse({
    status: 200,
    description: 'Returns current business theme',
    type: BusinessTheme,
  })
  @Get('current')
  @Public()
  @SkipBusinessCheck()
  async getCurrentBusinessTheme(@Req() req: Request) {
    // Extract user from token if provided (optional authentication)
    let user: User | null = null;
    
    try {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        
        // Check if token is revoked
        const isRevoked = await this.tokenService.isTokenInvalidated(token);
        if (!isRevoked) {
          // Verify and decode token
          const secret = this.configService.get('jwt').secret;
          const payload = this.jwtService.verify(token, { secret });
          
          // Get user from database
          if (payload?.id) {
            user = await this.usersService.getUserByIdWithRefUserId(payload.id);
          }
        }
      }
    } catch (error) {
      // If token is invalid or expired, just continue without user (public endpoint)
      // Don't throw error, just set user to null
      user = null;
    }
    
    return this.businessThemeService.getCurrentBusinessTheme(user);
  }


  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logoLight', maxCount: 1 },
      { name: 'logoDark', maxCount: 1 },
      { name: 'favicon', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create or update business theme' })
  @ApiBody({
    type: CreateBusinessThemeDto,
    description: 'Business theme data',
  })
  @ApiResponse({
    status: 200,
    description: 'Business theme created or updated successfully',
    type: BusinessTheme,
  })
  @Post()
  @SkipBusinessCheck()
  async createOrUpdateTheme(
    @Body() themeData: OmitType<CreateBusinessThemeDto, 'logoLight' | 'logoDark' | 'favicon'>,
    @UploadedFiles()
    files: {
      logoLight?: Express.Multer.File[];
      logoDark?: Express.Multer.File[];
      favicon?: Express.Multer.File[];
    },
    @AuthUser() user: User
  ) {
    // Validate logo files (2MB limit)
    const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
    if (files?.logoLight?.[0] && files.logoLight[0].size > MAX_LOGO_SIZE) {
      throw new BadRequestException('Logo light file size exceeds maximum allowed size of 2MB');
    }
    if (files?.logoDark?.[0] && files.logoDark[0].size > MAX_LOGO_SIZE) {
      throw new BadRequestException('Logo dark file size exceeds maximum allowed size of 2MB');
    }

    // Validate favicon (512KB limit)
    const MAX_FAVICON_SIZE = 512 * 1024; // 512KB
    if (files?.favicon?.[0] && files.favicon[0].size > MAX_FAVICON_SIZE) {
      throw new BadRequestException('Favicon file size exceeds maximum allowed size of 512KB');
    }

    return this.businessThemeService.upsertBusinessTheme(user, themeData as CreateBusinessThemeDto, files);
  }
}
