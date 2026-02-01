import {
  Controller,
  Get,
  Body,
  Post,
  NotFoundException,
  Query,
  Param,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { UserAvailabilityService } from './user-availability.service';
import {
  CreateUserAvailabilityDto,
  UserAvailabilityDto,
  CheckUserAvailabilityRequestDto,
  CheckUserAvailabilityResponseDto,
} from '@shared/dtos/user-availability-dtos';
import { UserAvailability } from './entities/user-availability.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { LoggerService } from '@/common/logger/logger.service';
import { DEFAULT_WEEKLY_SCHEDULE } from './constants';
import { Timezone } from '@/decorators/timezone.decorator';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('User Availability')
@Controller('user-availability')
@MinUserLevel(EUserLevels.MEMBER)
export class UserAvailabilityController {
  private readonly logger = new LoggerService(UserAvailabilityController.name);
  constructor(
    private readonly userAvailabilityService: UserAvailabilityService,
  ) {}

  @ApiOperation({ summary: 'Get current user availability' })
  @ApiResponse({
    status: 200,
    description: 'Returns current user availability',
    type: UserAvailabilityDto,
  })
  @ApiResponse({ status: 404, description: 'User availability not found' })
  @Get()
  async getMyAvailability(@AuthUser() user: User): Promise<UserAvailability> {
    let availability: UserAvailability | null = null;
    try {
      availability = await this.userAvailabilityService.getSingle({
        userId: user.id,
      });
      if (!availability)
        throw new NotFoundException('User availability not found');
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      if (error instanceof NotFoundException) {
        availability = await this.userAvailabilityService.create({
          userId: user.id,
          weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
          unavailablePeriods: [],
        });
      } else {
        throw error;
      }
    }
    return availability;
  }

  @ApiOperation({ summary: 'Create or update user availability' })
  @ApiBody({
    type: CreateUserAvailabilityDto,
    description: 'Create or update user availability',
  })
  @ApiResponse({
    status: 200,
    description: 'User availability created or updated successfully',
  })
  @Post()
  createOrUpdate(
    @Body() createUserAvailabilityDto: CreateUserAvailabilityDto,
    @AuthUser() user: User,
  ): Promise<UserAvailability> {
    return this.userAvailabilityService.createOrUpdateUserAvailability(
      createUserAvailabilityDto,
      user.id,
    );
  }

  @ApiOperation({
    summary: 'Check if a user is available at a specific date and time',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to check availability for',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns availability status',
    type: CheckUserAvailabilityResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request parameters',
  })
  @Get(':userId/check-availability')
  async checkAvailability(
    @Param('userId') userId: string,
    @Query() queryDto: CheckUserAvailabilityRequestDto,
    @Timezone() timezone: string,
  ): Promise<CheckUserAvailabilityResponseDto> {
    return this.userAvailabilityService.checkAvailabilityAtDateTime(
      userId,
      queryDto,
      timezone,
    );
  }
}
