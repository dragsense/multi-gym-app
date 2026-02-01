import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    NotFoundException,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiTags,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';

import { BusinessSubscriptionService } from '../services/business-subscription.service';
import { BusinessSubscriptionHistoryService } from '../services/business-subscription-history.service';
import { BusinessSubscription } from '../entities/business-subscription.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { ESubscriptionStatus, EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { Timezone } from '@/decorators/timezone.decorator';
import {
    SingleQueryDto,
    BusinessSubscriptionListDto,
    BusinessSubscriptionDto,
    BusinessSubscriptionStatusDto,
    CreateBusinessSubscriptionDto,
    BusinessSubscriptionHistoryListDto,
    CurrentBusinessSubscriptionSummaryDto,
} from '@shared/dtos';
import { BusinessService } from '../business.service';

@ApiBearerAuth('access-token')
@ApiTags('Business Subscriptions')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
@Controller('business-subscriptions')
export class BusinessSubscriptionController {
    constructor(
        private readonly businessSubscriptionService: BusinessSubscriptionService,
        private readonly businessService: BusinessService,
        private readonly businessSubscriptionHistoryService: BusinessSubscriptionHistoryService,
    ) { }

    @ApiOperation({ summary: 'Get all business subscriptions for a specific business' })
    @ApiParam({ name: 'businessId', description: 'Business ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns list of business subscriptions',
        type: [BusinessSubscriptionDto],
    })
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @Get('business/:businessId')
    async getBusinessSubscriptions(
        @Param('businessId') businessId: string,
        @Query() query: BusinessSubscriptionListDto,
    ) {
        return this.businessSubscriptionService.getAll(
            { ...query, businessId } as any,
            BusinessSubscriptionListDto,
            {
                beforeQuery: (queryBuilder: any) => {
                    queryBuilder.andWhere('entity.businessId = :businessId', { businessId });
                    return queryBuilder;
                },
            },
        );
    }

    @ApiOperation({ summary: 'Get business subscription by ID' })
    @ApiParam({ name: 'id', description: 'Business Subscription ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns business subscription by ID',
        type: BusinessSubscriptionDto,
    })
    @ApiResponse({ status: 404, description: 'Business subscription not found' })
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @Get(':id')
    async getBusinessSubscription(
        @Param('id') id: string,
        @Query() query: SingleQueryDto<BusinessSubscription>,
    ) {
        const businessSubscription = await this.businessSubscriptionService.getSingle(id, query);
        if (!businessSubscription) {
            throw new NotFoundException('Business subscription not found');
        }
        return businessSubscription;
    }


    @ApiOperation({ summary: 'Get current subscription status' })
    @ApiParam({ name: 'id', description: 'Business Subscription ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns current subscription status from latest history entry',
    })
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @Get(':id/status')
    async getSubscriptionStatus(@Param('id') id: string) {
        return this.businessSubscriptionService.getBusinessSubscriptionStatus(id);
    }

    @ApiOperation({ summary: 'Get current active subscription for a business' })
    @ApiParam({ name: 'businessId', description: 'Business ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns current active subscription for the business',
        type: BusinessSubscriptionDto,
    })
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @Get('business/:businessId/current')
    async getCurrentBusinessSubscription(@Param('businessId') businessId: string) {
        const subscription = await this.businessSubscriptionService.getCurrentBusinessSubscription(
            businessId,
        );
        if (!subscription) {
            throw new NotFoundException('No active subscription found for this business');
        }
        return subscription;
    }


    @ApiOperation({ summary: 'Get current active subscription for a business' })
    @ApiParam({ name: 'businessId', description: 'Business ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns current active subscription for the business',
        type: BusinessSubscriptionDto,
    })
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @Get('business/:businessId/status')
    async getCurrentBusinessSubscriptionStatus(@Param('businessId') businessId: string) {
        return this.businessSubscriptionService.getBusinessSubscriptionStatusByBusinessId(businessId);
    }

    @ApiOperation({ summary: 'Get my business subscription status' })
    @ApiResponse({
        status: 200,
        description: 'Returns subscription status for current user\'s business',
        type: BusinessSubscriptionStatusDto,
    })
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @Get('me/subscription/status')
    async getMyBusinessSubscriptionStatus(@AuthUser() currentUser: User) {
        return this.businessSubscriptionService.getUserBusinessSubscriptionStatus(currentUser);
    }

    @ApiOperation({ summary: 'Get my business subscription summary' })
    @ApiResponse({
        status: 200,
        description: 'Returns full subscription summary for current user\'s business including name, price, color, etc.',
        type: CurrentBusinessSubscriptionSummaryDto,
    })
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @Get('me/subscription/summary')
    async getMyBusinessSubscriptionSummary(@AuthUser() currentUser: User) {
        return this.businessSubscriptionService.getMyBusinessSubscriptionSummary(currentUser);
    }

    @ApiOperation({ summary: 'Get subscription history by business subscription ID' })
    @ApiParam({ name: 'id', description: 'Business Subscription ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns subscription history entries for the business subscription',
    })
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @Get(':id/history')
    async getSubscriptionHistory(
        @Param('id') id: string,
        @Query() query: BusinessSubscriptionHistoryListDto,
    ) {
        return this.businessSubscriptionHistoryService.getAll(
            { ...query, businessSubscriptionId: id } as any,
            BusinessSubscriptionHistoryListDto,
            {
                beforeQuery: async (queryBuilder: any) => {
                    queryBuilder
                        .leftJoinAndSelect('entity.businessSubscription', 'businessSubscription')
                        .leftJoinAndSelect('businessSubscription.subscription', 'subscription')
                        .andWhere('entity.businessSubscriptionId = :businessSubscriptionId', { businessSubscriptionId: id });
                    return queryBuilder;
                },
            },
        );
    }

}
