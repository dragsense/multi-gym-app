import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BusinessSubscriptionHistoryService } from '../services/business-subscription-history.service';
import {
  BusinessSubscriptionHistoryListDto,
  BusinessSubscriptionHistoryDto,
} from '@shared/dtos';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Business Subscription History')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
@Controller('business-subscription-history')
export class BusinessSubscriptionHistoryController {
  constructor(
    private readonly businessSubscriptionHistoryService: BusinessSubscriptionHistoryService,
  ) {}

  @ApiOperation({ summary: 'Get all subscription history for a business by business ID (deprecated, use paginated endpoint)' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all subscription history entries for the business',
    type: [BusinessSubscriptionHistoryDto],
  })
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  @Get('business/:businessId/all')
  async getHistoryByBusinessId(@Param('businessId') businessId: string) {
    return this.businessSubscriptionHistoryService.getHistoryByBusinessId(businessId);
  }

  @ApiOperation({ summary: 'Get paginated subscription history for a business by business ID' })
  @ApiParam({ name: 'businessId', description: 'Business ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated subscription history entries for the business',
  })
  @Get('business/:businessId')
  async getPaginatedHistoryByBusinessId(
    @Param('businessId') businessId: string,
    @Query() query: BusinessSubscriptionHistoryListDto,
  ) {
    return this.businessSubscriptionHistoryService.get(
      query,
      BusinessSubscriptionHistoryListDto,
      {
        beforeQuery: async (queryBuilder: any) => {
          queryBuilder
            .leftJoinAndSelect('entity.businessSubscription', 'businessSubscription')
            .leftJoinAndSelect('businessSubscription.subscription', 'subscription')
            .leftJoinAndSelect('businessSubscription.business', 'business')
            .andWhere('businessSubscription.businessId = :businessId', { businessId });
          return queryBuilder;
        },
      },
    );
  }

  @ApiOperation({ summary: 'Get subscription history by business subscription ID' })
  @ApiParam({ name: 'businessSubscriptionId', description: 'Business Subscription ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns subscription history entries for the business subscription',
    type: [BusinessSubscriptionHistoryDto],
  })
  @MinUserLevel(EUserLevels.SUPER_ADMIN)
  @Get(':businessSubscriptionId')
  async getHistoryByBusinessSubscriptionId(
    @Param('businessSubscriptionId') businessSubscriptionId: string,
  ) {
    return this.businessSubscriptionHistoryService.getAll(
      { businessSubscriptionId },
      undefined,
      {
        beforeQuery: async (queryBuilder: any) => {
          queryBuilder
            .leftJoinAndSelect('entity.businessSubscription', 'businessSubscription')
            .leftJoinAndSelect('businessSubscription.subscription', 'subscription')
            .andWhere('entity.businessSubscriptionId = :businessSubscriptionId', { businessSubscriptionId });
          return queryBuilder;
        },
      },
    );
  }
}
