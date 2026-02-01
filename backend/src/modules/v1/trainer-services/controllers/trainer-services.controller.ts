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

import { TrainerServicesService } from '../services/trainer-services.service';
import { TrainerService } from '../entities/trainer-service.entity';
import {
  CreateTrainerServiceDto,
  UpdateTrainerServiceDto,
  TrainerServiceListDto,
  TrainerServicePaginationDto,
  UpdateTrainerServiceStatusDto,
} from '@shared/dtos';
import { SingleQueryDto } from '@shared/dtos/common/list-query.dto';
import { IMessageResponse } from '@shared/interfaces';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Trainer Services')
@Controller('trainer-services')
@MinUserLevel(EUserLevels.ADMIN)
export class TrainerServicesController {
  constructor(private readonly trainerServicesService: TrainerServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all trainer services with pagination and filters' })
  @ApiResponse({ status: 200, type: TrainerServicePaginationDto })
  @MinUserLevel(EUserLevels.STAFF)
  findAll(@Query() query: TrainerServiceListDto) {
    return this.trainerServicesService.get(query, TrainerServiceListDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single trainer service by ID' })
  @ApiParam({ name: 'id', description: 'Trainer Service ID' })
  @ApiResponse({ status: 200, type: TrainerService })
  @ApiResponse({ status: 404, description: 'Trainer service not found' })
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<TrainerService>,
  ): Promise<TrainerService> {
    const trainerService = await this.trainerServicesService.getSingle(id, {
      ...query,
    });
    if (!trainerService) {
      throw new NotFoundException(`Trainer service with ID ${id} not found`);
    }
    return trainerService;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new trainer service' })
  @ApiBody({ type: CreateTrainerServiceDto })
  @ApiResponse({ status: 201, description: 'Trainer service created successfully' })
  async create(
    @Body() createTrainerServiceDto: CreateTrainerServiceDto,
  ): Promise<IMessageResponse & { trainerService: TrainerService }> {
    return this.trainerServicesService.createTrainerService(createTrainerServiceDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update trainer service by ID' })
  @ApiParam({ name: 'id', description: 'Trainer Service ID' })
  @ApiBody({ type: UpdateTrainerServiceDto })
  @ApiResponse({ status: 200, description: 'Trainer service updated successfully' })
  @ApiResponse({ status: 404, description: 'Trainer service not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTrainerServiceDto: UpdateTrainerServiceDto,
  ): Promise<IMessageResponse> {
    return this.trainerServicesService.updateTrainerService(id, updateTrainerServiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete trainer service by ID' })
  @ApiParam({ name: 'id', description: 'Trainer Service ID' })
  @ApiResponse({ status: 200, description: 'Trainer service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Trainer service not found' })
  async remove(@Param('id') id: string): Promise<IMessageResponse> {
    await this.trainerServicesService.delete(id);
    return { message: 'Trainer service deleted successfully' };
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Update trainer service status' })
  @ApiParam({ name: 'id', description: 'Trainer Service ID' })
  @ApiBody({ type: UpdateTrainerServiceStatusDto })
  @ApiResponse({ status: 200, description: 'Trainer service status updated successfully' })
  @ApiResponse({ status: 404, description: 'Trainer service not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTrainerServiceStatusDto,
  ): Promise<IMessageResponse> {
    return this.trainerServicesService.updateTrainerServiceStatus(id, updateStatusDto);
  }
}

