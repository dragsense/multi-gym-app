import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiTags,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';

import { BusinessSubscriptionBillingService } from '../services/business-subscription-billing.service';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { BusinessSubscriptionPaymentIntentDto, CreateBusinessSubscriptionPaymentIntentDto } from '@shared/dtos/business-dtos';
import { Timezone } from '@/decorators/timezone.decorator';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';
import { SkipBusinessCheck } from '@/decorators/skip-business-check.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Business Billing')
@MinUserLevel(EUserLevels.PLATFORM_OWNER)
@Controller('business-billings')
export class BusinessSubscriptionBillingController {
    constructor(private readonly businessSubscriptionBillingService: BusinessSubscriptionBillingService) { }

    @ApiOperation({ summary: 'Create payment intent for a business' })
    @ApiBody({ type: BusinessSubscriptionPaymentIntentDto })
    @ApiResponse({
        status: 200,
        description: 'Payment intent created',
    })
    @Post('payment-intent')
    @MinUserLevel(EUserLevels.SUPER_ADMIN)
    @SkipBusinessCheck()
    async createBusinessPaymentIntent(
        @Body() businessSubscriptionPaymentIntentDto: CreateBusinessSubscriptionPaymentIntentDto,
        @AuthUser() currentUser: User,
        @Timezone() timezone: string,
    ) {
        return this.businessSubscriptionBillingService.createBusinessSubscriptionPaymentIntent(
            businessSubscriptionPaymentIntentDto,
            currentUser,
            timezone,
        );
    }
}
