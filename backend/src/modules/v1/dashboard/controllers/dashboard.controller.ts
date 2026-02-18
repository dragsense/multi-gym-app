import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { DashboardAnalyticsDto, DashboardStatsResponseDto } from '@shared/dtos';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @MinUserLevel(EUserLevels.ADMIN)
  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics overview' })
  @ApiResponse({
    status: 200,
    type: DashboardStatsResponseDto,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats(
    @AuthUser() currentUser: User,
  ): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getDashboardStats(currentUser);
  }

  @MinUserLevel(EUserLevels.ADMIN)
  @Get('sessions/analytics')
  @ApiOperation({ summary: 'Get sessions analytics' })
  @ApiResponse({
    status: 200,
    description: 'Sessions analytics retrieved successfully',
  })
  async getSessionsAnalytics(
    @AuthUser() currentUser: User,
    @Query() query: DashboardAnalyticsDto,
  ) {
    return this.dashboardService.getSessionsAnalytics(currentUser, query);
  }

  @MinUserLevel(EUserLevels.ADMIN)
  @Get('billing/analytics')
  @ApiOperation({ summary: 'Get comprehensive billing analytics' })
  @ApiResponse({
    status: 200,
    description: 'Billing analytics retrieved successfully',
  })
  async getBillingAnalytics(
    @AuthUser() currentUser: User,
    @Query() query: DashboardAnalyticsDto,
  ) {
    return this.dashboardService.getBillingAnalytics(currentUser, query);
  }

  // @MinUserLevel(EUserLevels.ADMIN)
  // @Get('members/analytics')
  // @ApiOperation({ summary: 'Get members analytics' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Members analytics retrieved successfully',
  // })
  // async getMembersAnalytics(
  //   @AuthUser() currentUser: User,
  //   @Query() query: DashboardAnalyticsDto,
  // ) {
  //   return this.dashboardService.getMembersAnalytics(currentUser, query);
  // }

  // @MinUserLevel(EUserLevels.ADMIN)
  // @Get('memberships/analytics')
  // @ApiOperation({ summary: 'Get memberships analytics' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Memberships analytics retrieved successfully',
  // })
  // async getMembershipsAnalytics(
  //   @AuthUser() currentUser: User,
  //   @Query() query: DashboardAnalyticsDto,
  // ) {
  //   return this.dashboardService.getMembershipsAnalytics(currentUser, query);
  // }

  // @MinUserLevel(EUserLevels.ADMIN)
  // @Get('checkins/analytics')
  // @ApiOperation({ summary: 'Get checkins analytics' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Checkins analytics retrieved successfully',
  // })
  // async getCheckinsAnalytics(
  //   @AuthUser() currentUser: User,
  //   @Query() query: DashboardAnalyticsDto,
  // ) {
  //   return this.dashboardService.getCheckinsAnalytics(currentUser, query);
  // }
}