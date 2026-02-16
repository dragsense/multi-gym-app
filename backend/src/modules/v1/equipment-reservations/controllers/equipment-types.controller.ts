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

import { EquipmentTypesService } from '../services/equipment-types.service';
import {
  CreateEquipmentTypeDto,
  UpdateEquipmentTypeDto,
  EquipmentTypeListDto,
  EquipmentTypePaginatedDto,
  EquipmentTypeDto,
  SingleQueryDto,
} from '@shared/dtos';
import { EquipmentType } from '../entities/equipment-type.entity';
import { EUserLevels } from '@shared/enums';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { MinUserLevel } from '@/decorators/level.decorator';
import { RequireModule } from '@/decorators/require-module.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiBearerAuth('access-token')
@ApiTags('Equipment Types')
@MinUserLevel(EUserLevels.ADMIN)
@RequireModule(ESubscriptionFeatures.EQUIPMENT_RESERVATION)
@Controller('equipment-types')
export class EquipmentTypesController {
  constructor(private readonly equipmentTypesService: EquipmentTypesService) {}

  @ApiOperation({ summary: 'Get all equipment types with pagination and filters' })
  @ApiResponse({ status: 200, type: EquipmentTypePaginatedDto })
  @Get()
  findAll(@Query() query: EquipmentTypeListDto) {
    return this.equipmentTypesService.get(query, EquipmentTypeListDto);
  }

  @ApiOperation({ summary: 'Get a single equipment type by ID' })
  @ApiParam({ name: 'id', description: 'Equipment type ID' })
  @ApiResponse({ status: 200, type: EquipmentTypeDto })
  @ApiResponse({ status: 404, description: 'Equipment type not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<EquipmentType>,
  ): Promise<EquipmentType> {
    const equipmentType = await this.equipmentTypesService.getSingle(id, query);
    if (!equipmentType) {
      throw new NotFoundException(`Equipment type with ID ${id} not found`);
    }
    return equipmentType;
  }

  @ApiOperation({ summary: 'Create a new equipment type' })
  @ApiBody({ type: CreateEquipmentTypeDto })
  @ApiResponse({ status: 201, description: 'Equipment type created successfully' })
  @Post()
  create(@Body() createDto: CreateEquipmentTypeDto) {
    return this.equipmentTypesService.create(createDto);
  }

  @ApiOperation({ summary: 'Update an equipment type' })
  @ApiParam({ name: 'id', description: 'Equipment type ID' })
  @ApiBody({ type: UpdateEquipmentTypeDto })
  @ApiResponse({ status: 200, description: 'Equipment type updated successfully' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateEquipmentTypeDto) {
    return this.equipmentTypesService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete an equipment type' })
  @ApiParam({ name: 'id', description: 'Equipment type ID' })
  @ApiResponse({ status: 200, description: 'Equipment type deleted successfully' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipmentTypesService.delete(id);
  }
}
