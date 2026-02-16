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

import { AccessHoursService } from './access-hours.service';
import {
  CreateAccessHourDto,
  UpdateAccessHourDto,
  AccessHourListDto,
  AccessHourPaginatedDto,
  AccessHourDto,
  SingleQueryDto,
} from '@shared/dtos';
import { AccessHour } from './entities/access-hour.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiBearerAuth('access-token')
@ApiTags('Access Hours')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('access-hours')
export class AccessHoursController {
  constructor(private readonly accessHoursService: AccessHoursService) {}

  @ApiOperation({ summary: 'Get all access hours with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of access hours',
    type: AccessHourPaginatedDto,
  })
  @Get()
  findAll(@Query() query: AccessHourListDto) {
    return this.accessHoursService.get(query, AccessHourListDto);
  }

  @ApiOperation({ summary: 'Get access hour by ID' })
  @ApiParam({ name: 'id', description: 'Access hour ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns access hour by ID',
    type: AccessHourDto,
  })
  @ApiResponse({ status: 404, description: 'Access hour not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<AccessHour>,
  ) {
    const accessHour = await this.accessHoursService.getSingle(id, query);
    if (!accessHour) throw new NotFoundException('Access hour not found');
    return accessHour;
  }

  @ApiOperation({ summary: 'Add a new access hour' })
  @ApiBody({
    type: CreateAccessHourDto,
    description: 'Create a new access hour',
  })
  @ApiResponse({ status: 201, description: 'Access hour created successfully' })
  @Post()
  create(
    @Body() createAccessHourDto: CreateAccessHourDto,
    @AuthUser() currentUser: User,
  ) {
    return this.accessHoursService.createAccessHour(createAccessHourDto);
  }

  @ApiOperation({ summary: 'Update access hour by ID' })
  @ApiParam({ name: 'id', description: 'Access hour ID' })
  @ApiBody({
    type: UpdateAccessHourDto,
    description: 'Update access hour information',
  })
  @ApiResponse({ status: 200, description: 'Access hour updated successfully' })
  @ApiResponse({ status: 404, description: 'Access hour not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccessHourDto: UpdateAccessHourDto,
    @AuthUser() currentUser: User,
  ) {
    return this.accessHoursService.updateAccessHour(id, updateAccessHourDto);
  }

  @ApiOperation({ summary: 'Delete access hour by ID' })
  @ApiParam({
    name: 'id',
    description: 'Access hour ID',
  })
  @ApiResponse({ status: 200, description: 'Access hour deleted successfully' })
  @ApiResponse({ status: 404, description: 'Access hour not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.accessHoursService.delete(id);
    return { message: 'Access hour deleted successfully' };
  }
}

