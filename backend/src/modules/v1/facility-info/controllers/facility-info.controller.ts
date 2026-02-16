import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

import { FacilityInfoService } from '../services/facility-info.service';
import { FacilityInfo } from '../entities/facility-info.entity';
import {
  CreateFacilityInfoDto,
  UpdateFacilityInfoDto,
  FacilityInfoListDto,
  FacilityInfoPaginationDto,
  UpdateFacilityInfoStatusDto,
} from '@shared/dtos';
import { SingleQueryDto } from '@shared/dtos/common/list-query.dto';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Facility Info')
@MinUserLevel(EUserLevels.ADMIN)
@Resource(EResource.FACILITY_INFO)
@Controller('facility-info')
export class FacilityInfoController {
  constructor(private readonly facilityInfoService: FacilityInfoService) {}

  @Get()
  @ApiOperation({ summary: 'Get all facility info with pagination and filters' })
  @ApiResponse({ status: 200, type: FacilityInfoPaginationDto })
  findAll(@Query() query: FacilityInfoListDto) {
    return this.facilityInfoService.get(query, FacilityInfoListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single facility info by ID' })
  @ApiParam({ name: 'id', description: 'Facility Info ID' })
  @ApiResponse({ status: 200, type: FacilityInfo })
  @ApiResponse({ status: 404, description: 'Facility info not found' })
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<FacilityInfo>,
  ): Promise<FacilityInfo> {
    const facilityInfo = await this.facilityInfoService.getSingle(id, query);
    if (!facilityInfo) {
      throw new NotFoundException(`Facility info with ID ${id} not found`);
    }
    return facilityInfo;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new facility info' })
  @ApiBody({ type: CreateFacilityInfoDto })
  @ApiResponse({ status: 201, description: 'Facility info created successfully' })
  async create(
    @Body() createFacilityInfoDto: CreateFacilityInfoDto,
  ): Promise<IMessageResponse & { facilityInfo: FacilityInfo }> {
    return this.facilityInfoService.createFacilityInfo(createFacilityInfoDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update facility info by ID' })
  @ApiParam({ name: 'id', description: 'Facility Info ID' })
  @ApiBody({ type: UpdateFacilityInfoDto })
  @ApiResponse({ status: 200, description: 'Facility info updated successfully' })
  @ApiResponse({ status: 404, description: 'Facility info not found' })
  async update(
    @Param('id') id: string,
    @Body() updateFacilityInfoDto: UpdateFacilityInfoDto,
  ): Promise<IMessageResponse> {
    return this.facilityInfoService.updateFacilityInfo(id, updateFacilityInfoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete facility info by ID' })
  @ApiParam({ name: 'id', description: 'Facility Info ID' })
  @ApiResponse({ status: 200, description: 'Facility info deleted successfully' })
  @ApiResponse({ status: 404, description: 'Facility info not found' })
  async remove(@Param('id') id: string): Promise<IMessageResponse> {
    await this.facilityInfoService.delete(id);
    return { message: 'Facility info deleted successfully' };
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Update facility info status' })
  @ApiParam({ name: 'id', description: 'Facility Info ID' })
  @ApiBody({ type: UpdateFacilityInfoStatusDto })
  @ApiResponse({ status: 200, description: 'Facility info status updated successfully' })
  @ApiResponse({ status: 404, description: 'Facility info not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateFacilityInfoStatusDto,
  ): Promise<IMessageResponse> {
    return this.facilityInfoService.updateFacilityInfoStatus(id, updateStatusDto);
  }
}

