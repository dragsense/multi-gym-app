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

import { AdvertisementsService } from '../services/advertisements.service';
import { Advertisement } from '../entities/advertisement.entity';
import {
  CreateAdvertisementDto,
  UpdateAdvertisementDto,
  AdvertisementListDto,
  AdvertisementPaginationDto,
  UpdateAdvertisementStatusDto,
} from '@shared/dtos';
import { SingleQueryDto } from '@shared/dtos/common/list-query.dto';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { RequireModule } from '@/decorators/require-module.decorator';
import { EUserLevels } from '@shared/enums';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Advertisements')
@Resource(EResource.ADVERTISEMENTS)
@Controller('advertisements')
@MinUserLevel(EUserLevels.ADMIN)
@RequireModule(ESubscriptionFeatures.ADVERTISEMENTS)
export class AdvertisementsController {
  constructor(private readonly advertisementsService: AdvertisementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all advertisements with pagination and filters' })
  @ApiResponse({ status: 200, type: AdvertisementPaginationDto })
  findAll(@Query() query: AdvertisementListDto) {
    return this.advertisementsService.get(query, AdvertisementListDto);
  }

  @Get('active')
  @MinUserLevel(EUserLevels.MEMBER)
  @ApiOperation({ 
    summary: 'Get currently active advertisements',
    description: 'Returns advertisements where status is ACTIVE and current date is between startDate and endDate'
  })
  @ApiResponse({ status: 200, type: [Advertisement] })
  getActiveAdvertisements(@Query('limit') limit?: number) {
    return this.advertisementsService.getActiveAdvertisements(limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single advertisement by ID' })
  @ApiParam({ name: 'id', description: 'Advertisement ID' })
  @ApiResponse({ status: 200, type: Advertisement })
  @ApiResponse({ status: 404, description: 'Advertisement not found' })
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Advertisement>,
  ): Promise<Advertisement> {
    const advertisement = await this.advertisementsService.getSingle(id, {
      ...query,
      _relations: ['bannerImage', 'bannerImage.image'],
    });
    if (!advertisement) {
      throw new NotFoundException(`Advertisement with ID ${id} not found`);
    }
    return advertisement;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new advertisement' })
  @ApiBody({ type: CreateAdvertisementDto })
  @ApiResponse({ status: 201, description: 'Advertisement created successfully' })
  async create(
    @Body() createAdvertisementDto: CreateAdvertisementDto,
  ): Promise<IMessageResponse & { advertisement: Advertisement }> {
    return this.advertisementsService.createAdvertisement(createAdvertisementDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update advertisement by ID' })
  @ApiParam({ name: 'id', description: 'Advertisement ID' })
  @ApiBody({ type: UpdateAdvertisementDto })
  @ApiResponse({ status: 200, description: 'Advertisement updated successfully' })
  @ApiResponse({ status: 404, description: 'Advertisement not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAdvertisementDto: UpdateAdvertisementDto,
  ): Promise<IMessageResponse> {
    return this.advertisementsService.updateAdvertisement(id, updateAdvertisementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete advertisement by ID' })
  @ApiParam({ name: 'id', description: 'Advertisement ID' })
  @ApiResponse({ status: 200, description: 'Advertisement deleted successfully' })
  @ApiResponse({ status: 404, description: 'Advertisement not found' })
  async remove(@Param('id') id: string): Promise<IMessageResponse> {
    await this.advertisementsService.delete(id);
    return { message: 'Advertisement deleted successfully' };
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Update advertisement status' })
  @ApiParam({ name: 'id', description: 'Advertisement ID' })
  @ApiBody({ type: UpdateAdvertisementStatusDto })
  @ApiResponse({ status: 200, description: 'Advertisement status updated successfully' })
  @ApiResponse({ status: 404, description: 'Advertisement not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAdvertisementStatusDto,
  ): Promise<IMessageResponse> {
    return this.advertisementsService.updateAdvertisementStatus(id, updateStatusDto);
  }
}

