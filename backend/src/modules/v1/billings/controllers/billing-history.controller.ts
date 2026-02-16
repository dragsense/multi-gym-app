import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BillingHistoryService } from '../services/billing-history.service';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Billing History')
@MinUserLevel(EUserLevels.MEMBER)
@Controller('billing-history')
export class BillingHistoryController {
  constructor(private readonly billingHistoryService: BillingHistoryService) {}

  @ApiOperation({ summary: 'Get billing history by billing ID' })
  @ApiParam({ name: 'billingId', description: 'Billing ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns billing history entries',
  })
  @Get(':billingId')
  async getHistoryByBillingId(@Param('billingId') billingId: string) {
    return this.billingHistoryService.getAll(
      { billingId: billingId },
      undefined,
    );
  }
}
