import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaysafeService } from '../services/paysafe.service';

@ApiTags('Paysafe')
@Controller('paysafe')
export class PaysafeController {
  constructor(private readonly paysafeService: PaysafeService) {}

  @ApiOperation({ summary: 'Get Paysafe.js setup (single-use token and environment)' })
  @ApiResponse({ status: 200, description: 'Returns key and environment for Paysafe.js' })
  @ApiResponse({ status: 404, description: 'Paysafe not configured' })
  @Get('setup')
  getSetup(): { singleUseTokenApiKey: string; environment: string } {
    const key = this.paysafeService.getSingleUseTokenApiKey();
    if (!key) {
      throw new NotFoundException('Paysafe is not configured');
    }
    return {
      singleUseTokenApiKey: key,
      environment: this.paysafeService.getEnvironment(),
    };
  }
}
