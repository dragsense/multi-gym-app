import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserSettingsService } from './user-settings.service';
import { CreateOrUpdateUserSettingsDto } from '@shared/dtos/settings-dtos';
import { IUserSettings } from '@shared/interfaces/settings.interface';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums/user.enum';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiTags('User Settings')
@ApiBearerAuth('access-token')
@Controller('user-settings')
@MinUserLevel(EUserLevels.MEMBER)
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update user settings' })
  @ApiResponse({
    status: 201,
    description: 'User settings created/updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createOrUpdate(
    @AuthUser() currentUser: User,
    @Body() createUserSettingsDto: CreateOrUpdateUserSettingsDto,
  ): Promise<{ message: string }> {
    await this.userSettingsService.createOrUpdateUserSettings(
      currentUser,
      createUserSettingsDto,
    );

    return { message: 'User settings created/updated successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({
    status: 200,
    description: 'User settings retrieved successfully',
  })
  async findOne(@AuthUser() currentUser: User): Promise<IUserSettings> {
    return this.userSettingsService.getUserSettings(currentUser.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user settings by user ID (Super Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User settings retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User settings not found' })
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  async findOneByUserId(
    @Param('userId') userId: string,
  ): Promise<IUserSettings> {
    return this.userSettingsService.getUserSettings(userId);
  }
}
