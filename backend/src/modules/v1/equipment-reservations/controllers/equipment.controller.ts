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

import { EquipmentService } from '../services/equipment.service';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  EquipmentListDto,
  EquipmentPaginatedDto,
  EquipmentDto,
  SingleQueryDto,
} from '@shared/dtos';
import { Equipment } from '../entities/equipment.entity';
import { EUserLevels } from '@shared/enums';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { MinUserLevel } from '@/decorators/level.decorator';
import { RequireModule } from '@/decorators/require-module.decorator';
import { NotFoundException } from '@nestjs/common';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Equipment')
@MinUserLevel(EUserLevels.ADMIN)
@RequireModule(ESubscriptionFeatures.EQUIPMENT_RESERVATION)
@Resource(EResource.EQUIPMENT)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @ApiOperation({ summary: 'Get all equipment with pagination and filters' })
  @ApiResponse({ status: 200, type: EquipmentPaginatedDto })
  @Get()
  findAll(@Query() query: EquipmentListDto) {
    return this.equipmentService.get(query, EquipmentListDto);
  }

  @ApiOperation({ summary: 'Get a single equipment by ID' })
  @ApiParam({ name: 'id', description: 'Equipment ID' })
  @ApiResponse({ status: 200, type: EquipmentDto })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Equipment>,
  ): Promise<Equipment> {
    const equipment = await this.equipmentService.getSingle(id, query);
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }
    return equipment;
  }

  @ApiOperation({ summary: 'Create a new equipment' })
  @ApiBody({ type: CreateEquipmentDto })
  @ApiResponse({ status: 201, description: 'Equipment created successfully' })
  @Post()
  create(@Body() createDto: CreateEquipmentDto) {
    return this.equipmentService.createEquipment(createDto);
  }

  @ApiOperation({ summary: 'Update an equipment' })
  @ApiParam({ name: 'id', description: 'Equipment ID' })
  @ApiBody({ type: UpdateEquipmentDto })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEquipmentDto) {
    return this.equipmentService.updateEquipment(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete an equipment' })
  @ApiParam({ name: 'id', description: 'Equipment ID' })
  @ApiResponse({ status: 200, description: 'Equipment deleted successfully' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentService.delete(id);
  }
}
