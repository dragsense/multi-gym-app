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

import { ServiceOffersService } from '../services/service-offers.service';
import { ServiceOffer } from '../entities/service-offer.entity';
import {
  CreateServiceOfferDto,
  UpdateServiceOfferDto,
  ServiceOfferListDto,
  ServiceOfferPaginationDto,
  UpdateServiceOfferStatusDto,
} from '@shared/dtos';
import { SingleQueryDto } from '@shared/dtos/common/list-query.dto';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';
import { User } from '@/common/base-user/entities/user.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';
  
@ApiBearerAuth('access-token')
@ApiTags('Service Offers')
@Resource(EResource.SERVICE_OFFERS)
@Controller('service-offers')
@MinUserLevel(EUserLevels.STAFF)
export class ServiceOffersController {
  constructor(private readonly serviceOffersService: ServiceOffersService) { }

  @Get()
  @ApiOperation({ summary: 'Get all service offers with pagination and filters' })
  @ApiResponse({ status: 200, type: ServiceOfferPaginationDto })
  @MinUserLevel(EUserLevels.MEMBER)
  findAll(@Query() query: ServiceOfferListDto) {
    return this.serviceOffersService.get(query, ServiceOfferListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single service offer by ID' })
  @ApiParam({ name: 'id', description: 'Service Offer ID' })
  @ApiResponse({ status: 200, type: ServiceOffer })
  @ApiResponse({ status: 404, description: 'Service offer not found' })
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<ServiceOffer>,
  ): Promise<ServiceOffer> {
    const serviceOffer = await this.serviceOffersService.getSingle(id, {
      ...query,
      _relations: ['trainer', 'trainer.user', 'trainerService'],
    });
    if (!serviceOffer) {
      throw new NotFoundException(`Service offer with ID ${id} not found`);
    }
    return serviceOffer;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service offer' })
  @ApiBody({ type: CreateServiceOfferDto })
  @ApiResponse({ status: 201, description: 'Service offer created successfully' })
  async create(
    @Body() createServiceOfferDto: CreateServiceOfferDto,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse & { serviceOffer: ServiceOffer }> {
    return this.serviceOffersService.createServiceOffer(createServiceOfferDto, currentUser);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service offer by ID' })
  @ApiParam({ name: 'id', description: 'Service Offer ID' })
  @ApiBody({ type: UpdateServiceOfferDto })
  @ApiResponse({ status: 200, description: 'Service offer updated successfully' })
  @ApiResponse({ status: 404, description: 'Service offer not found' })
  async update(
    @Param('id') id: string,
    @Body() updateServiceOfferDto: UpdateServiceOfferDto,
    @AuthUser() currentUser: User,
  ): Promise<IMessageResponse> {
    return this.serviceOffersService.updateServiceOffer(id, updateServiceOfferDto, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete service offer by ID' })
  @ApiParam({ name: 'id', description: 'Service Offer ID' })
  @ApiResponse({ status: 200, description: 'Service offer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service offer not found' })
  async remove(@Param('id') id: string): Promise<IMessageResponse> {
    await this.serviceOffersService.delete(id);
    return { message: 'Service offer deleted successfully' };
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Update service offer status' })
  @ApiParam({ name: 'id', description: 'Service Offer ID' })
  @ApiBody({ type: UpdateServiceOfferStatusDto })
  @ApiResponse({ status: 200, description: 'Service offer status updated successfully' })
  @ApiResponse({ status: 404, description: 'Service offer not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateServiceOfferStatusDto,
  ): Promise<IMessageResponse> {
    return this.serviceOffersService.updateServiceOfferStatus(id, updateStatusDto);
  }
}

