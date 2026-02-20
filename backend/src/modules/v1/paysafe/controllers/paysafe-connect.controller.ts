import { Body, Controller, Delete, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '@/decorators/user.decorator';
import { MinUserLevel } from '@/decorators/level.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import type {
  CreatePaysafeApplicationDto,
  PaysafeConnectResponseDto,
  PaysafeConnectStatusDto,
} from '@shared/dtos';
import { PaysafeConnectService } from '../services/paysafe-connect.service';

@ApiTags('Settings - Paysafe Connect (Applications API)')
@ApiBearerAuth()
@Controller('paysafe-connect')
@MinUserLevel(EUserLevels.SUPER_ADMIN)
export class PaysafeConnectController {
  constructor(private readonly paysafeConnectService: PaysafeConnectService) {}

  @Get()
  @ApiOperation({ summary: 'Get Paysafe application status for business' })
  @ApiResponse({ status: 200, description: 'Status retrieved', type: Object })
  async getStatus(@AuthUser() user: User): Promise<PaysafeConnectStatusDto> {
    return this.paysafeConnectService.getStatus(user);
  }

  @Post()
  @ApiOperation({ summary: 'Create Paysafe application (POST /merchant/v1/applications)' })
  @ApiResponse({ status: 201, description: 'Application created', type: Object })
  async create(
    @AuthUser() user: User,
    @Body() dto: CreatePaysafeApplicationDto,
  ): Promise<PaysafeConnectResponseDto> {
    return this.paysafeConnectService.connect(user, dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh Paysafe application status (GET /merchant/v1/applications/{appId})' })
  @ApiResponse({ status: 200, description: 'Status refreshed', type: Object })
  async refresh(@AuthUser() user: User): Promise<PaysafeConnectResponseDto> {
    return this.paysafeConnectService.refresh(user);
  }

  @Delete()
  @HttpCode(200)
  @ApiOperation({ summary: 'Disconnect Paysafe application from business' })
  @ApiResponse({ status: 200, description: 'Disconnected' })
  async disconnect(@AuthUser() user: User) {
    return this.paysafeConnectService.disconnect(user);
  }
}

