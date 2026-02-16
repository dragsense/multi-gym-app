import {
  Controller,
  Get,
  UseGuards,
  Body,
  Post,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { CheckinsService } from './checkins.service';
import {
  CreateCheckinDto,
  UpdateCheckinDto,
  CheckinListDto,
  CheckinPaginatedDto,
  CheckinDto,
  SingleQueryDto,
} from '@shared/dtos';
import { Checkin } from './entities/checkin.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { RequireModule } from '@/decorators/require-module.decorator';
import { NotFoundException } from '@nestjs/common';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Checkins')
@MinUserLevel(EUserLevels.ADMIN)
@RequireModule(ESubscriptionFeatures.CHECKINS)
@Resource(EResource.CHECKINS)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) { }

  @ApiOperation({ summary: 'Get all checkins with pagination and filters' })
  @ApiResponse({ status: 200, type: CheckinPaginatedDto })
  @Get()
  @MinUserLevel(EUserLevels.MEMBER)
  findAll(@Query() query: CheckinListDto) {
    return this.checkinsService.get(query, CheckinListDto);
  }

  @ApiOperation({ summary: 'Get checkins for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, type: CheckinPaginatedDto })
  @Get('user/:userId')
  getUserCheckins(
    @Param('userId') userId: string,
    @Query() query: CheckinListDto,
  ) {
    return this.checkinsService.get({
      ...query,
      userId,
    } as CheckinListDto);
  }

  @ApiOperation({ summary: 'Get a single checkin by ID' })
  @ApiParam({ name: 'id', description: 'Checkin ID' })
  @ApiResponse({ status: 200, type: CheckinDto })
  @ApiResponse({ status: 404, description: 'Checkin not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Checkin>,
  ): Promise<Checkin> {
    const checkin = await this.checkinsService.getSingle(id, query);
    if (!checkin) {
      throw new NotFoundException(`Checkin with ID ${id} not found`);
    }
    return checkin;
  }

  @ApiOperation({ summary: 'Create a new checkin' })
  @ApiBody({
    type: CreateCheckinDto,
    description: 'Create a new checkin',
  })
  @ApiResponse({ status: 201, description: 'Checkin created successfully' })
  @Post()
  create(
    @Body() createCheckinDto: CreateCheckinDto,
    @AuthUser() currentUser: User,
  ) {
    return this.checkinsService.createCheckin(createCheckinDto);
  }

  @ApiOperation({ summary: 'Update checkin by ID' })
  @ApiParam({ name: 'id', description: 'Checkin ID' })
  @ApiBody({
    type: UpdateCheckinDto,
    description: 'Update checkin information',
  })
  @ApiResponse({ status: 200, description: 'Checkin updated successfully' })
  @ApiResponse({ status: 404, description: 'Checkin not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCheckinDto: UpdateCheckinDto,
    @AuthUser() currentUser: User,
  ) {
    return this.checkinsService.updateCheckin(id, updateCheckinDto);
  }

  @ApiOperation({ summary: 'Checkout checkin by ID' })
  @ApiParam({ name: 'id', description: 'Checkin ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        checkOutTime: {
          type: 'string',
          format: 'date-time',
          description: 'Optional custom checkout time (ISO 8601). If not provided, current time will be used.',
        },
      },
    },
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Checkin checked out successfully' })
  @ApiResponse({ status: 404, description: 'Checkin not found' })
  @Post(':id/checkout')
  checkout(
    @Param('id') id: string,
    @Body() body?: { checkOutTime?: string },
  ) {
    return this.checkinsService.checkoutCheckin(id, body?.checkOutTime);
  }

  @ApiOperation({ summary: 'Delete checkin by ID' })
  @ApiParam({
    name: 'id',
    description: 'Checkin ID',
  })
  @ApiResponse({ status: 200, description: 'Checkin deleted successfully' })
  @ApiResponse({ status: 404, description: 'Checkin not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.checkinsService.delete(id);
    return { message: 'Checkin deleted successfully' };
  }

  @Post('Device/OpenDoor')
  @ApiOperation({ summary: 'Device-based check-in/check-out using QR code or RFID' })
  deviceCheckin(@Body() deviceCheckinDto: any, @Query() query: any) {
    return this.checkinsService.deviceCheckin(deviceCheckinDto, query);
  }
}

