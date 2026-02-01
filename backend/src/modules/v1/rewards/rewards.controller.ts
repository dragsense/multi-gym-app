import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';

@ApiTags('Rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('points')
  @ApiOperation({ summary: 'Get user reward points' })
  @ApiResponse({
    status: 200,
    description: 'User reward points retrieved successfully',
  })
  async getUserRewardPoints(@AuthUser() user: User) {
    const userId = user.id;
    const points = await this.rewardsService.getUserRewardPoints(userId);
    return { points };
  }
}
