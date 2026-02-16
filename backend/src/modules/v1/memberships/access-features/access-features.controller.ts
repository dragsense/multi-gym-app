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

import { AccessFeaturesService } from './access-features.service';
import {
  CreateAccessFeatureDto,
  UpdateAccessFeatureDto,
  AccessFeatureListDto,
  AccessFeaturePaginatedDto,
  AccessFeatureDto,
  SingleQueryDto,
} from '@shared/dtos';
import { AccessFeature } from './entities/access-feature.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiBearerAuth('access-token')
@ApiTags('Access Features')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('access-features')
export class AccessFeaturesController {
  constructor(private readonly accessFeaturesService: AccessFeaturesService) {}

  @ApiOperation({ summary: 'Get all access features with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of access features',
    type: AccessFeaturePaginatedDto,
  })
  @Get()
  findAll(@Query() query: AccessFeatureListDto) {
    return this.accessFeaturesService.get(query, AccessFeatureListDto);
  }

  @ApiOperation({ summary: 'Get access feature by ID' })
  @ApiParam({ name: 'id', description: 'Access feature ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns access feature by ID',
    type: AccessFeatureDto,
  })
  @ApiResponse({ status: 404, description: 'Access feature not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<AccessFeature>,
  ) {
    const accessFeature = await this.accessFeaturesService.getSingle(id, query);
    if (!accessFeature) throw new NotFoundException('Access feature not found');
    return accessFeature;
  }

  @ApiOperation({ summary: 'Add a new access feature' })
  @ApiBody({
    type: CreateAccessFeatureDto,
    description: 'Create a new access feature',
  })
  @ApiResponse({ status: 201, description: 'Access feature created successfully' })
  @Post()
  create(
    @Body() createAccessFeatureDto: CreateAccessFeatureDto,
    @AuthUser() currentUser: User,
  ) {
    return this.accessFeaturesService.create(createAccessFeatureDto);
  }

  @ApiOperation({ summary: 'Update access feature by ID' })
  @ApiParam({ name: 'id', description: 'Access feature ID' })
  @ApiBody({
    type: UpdateAccessFeatureDto,
    description: 'Update access feature information',
  })
  @ApiResponse({ status: 200, description: 'Access feature updated successfully' })
  @ApiResponse({ status: 404, description: 'Access feature not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccessFeatureDto: UpdateAccessFeatureDto,
    @AuthUser() currentUser: User,
  ) {
    return this.accessFeaturesService.update(id, updateAccessFeatureDto);
  }

  @ApiOperation({ summary: 'Delete access feature by ID' })
  @ApiParam({
    name: 'id',
    description: 'Access feature ID',
  })
  @ApiResponse({ status: 200, description: 'Access feature deleted successfully' })
  @ApiResponse({ status: 404, description: 'Access feature not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.accessFeaturesService.delete(id);
    return { message: 'Access feature deleted successfully' };
  }
}

