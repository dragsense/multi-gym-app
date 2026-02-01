import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFiles,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ProfilesService } from './profiles.service';

import { Profile } from './entities/profile.entity';
import { UpdateProfileDto } from '@shared/dtos';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { OmitType } from '@shared/lib/type-utils';
import { LoggerService } from '@/common/logger/logger.service';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { SkipBusinessCheck } from '@/decorators/skip-business-check.decorator';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Profiles')
@Controller('users-profile')
@SkipBusinessCheck()
@MinUserLevel(EUserLevels.MEMBER)
export class ProfilesController {
  private readonly logger = new LoggerService(ProfilesController.name);
  constructor(private readonly profilesService: ProfilesService) { }

  @Get()
  @ApiOperation({ summary: 'Get profile of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Profile found', type: Profile })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async findMe(@AuthUser() currentUser: User) {
    let profile: Profile | null = null;
    try {
      profile = await this.profilesService.getSingle(
        {
          userId: currentUser.id,
        },
        {
          _relations: ['image', 'documents'],
        },
      );
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      if (error instanceof NotFoundException) {
        profile = await this.profilesService.create({
          userId: currentUser.id,
        });
      } else {
        throw error;
      }
    }
    return profile;
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'documents', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @Patch()
  @ApiOperation({ summary: 'Update profile of the authenticated user' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: Profile })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async updateMe(
    @AuthUser() currentUser: User,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; documents?: Express.Multer.File[] },
    @Body() updateProfileDto: OmitType<UpdateProfileDto, 'image' | 'documents'>,
  ) {
    let profile: Profile | null = null;
    try {
      profile = await this.profilesService.getSingle({
        userId: currentUser.id,
      });
      if (!profile) throw new NotFoundException('Profile not found');
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));

      profile = await this.profilesService.create({
        userId: currentUser.id,
        ...updateProfileDto,
      });
    }

    const image = files?.image?.[0];
    const documents = files?.documents;

    return this.profilesService.updateProfile(
      profile.id,
      updateProfileDto,
      image,
      documents,
    );
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'documents', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @Patch(':id')
  @ApiOperation({ summary: 'Update profile by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Profile ID' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: Profile })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async update(
    @Param('id') id: string,
    @UploadedFiles()
    files: { image?: Express.Multer.File[]; documents?: Express.Multer.File[] },
    @Body() updateProfileDto: OmitType<UpdateProfileDto, 'image' | 'documents'>,
  ) {
    let profile: Profile | null = null;
    try {
      profile = await this.profilesService.getSingle(id);
      if (!profile) throw new NotFoundException('Profile not found');
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      if (error instanceof NotFoundException) {
        profile = await this.profilesService.create({ userId: id });
      } else {
        throw error;
      }
    }

    const image = files?.image?.[0];
    const documents = files?.documents;

    return this.profilesService.updateProfile(
      profile.id,
      updateProfileDto,
      image,
      documents,
    );
  }

  @Get(':userId/profile')
  @ApiOperation({ summary: 'Get profile by user ID' })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile found', type: Profile })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async findOne(@Param('userId') userId: string) {
    let profile: Profile | null = null;

    profile = await this.profilesService.getSingle({ userId });

    if (!profile) {
      profile = await this.profilesService.create({ userId });
    }

    return profile;
  }
}
