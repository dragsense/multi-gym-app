import {
  Controller,
  Get,
  Body,
  Post,
  Delete,
  Param,
  Query,
  Patch,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AttributeService } from '../services/attribute.service';
import {
  CreateAttributeDto,
  UpdateAttributeDto,
  AttributeListDto,
  AttributePaginatedDto,
  AttributeDto,
  SingleQueryDto,
} from '@shared/dtos';
import { Attribute } from '../entities/attribute.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiBearerAuth('access-token')
@ApiTags('Attributes')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('attributes')
export class AttributeController {
  constructor(private readonly attributeService: AttributeService) {}

  @ApiOperation({ summary: 'Get all attributes with pagination and filtering' })
  @ApiResponse({ status: 200, type: AttributePaginatedDto })
  @Get()
  findAll(@Query() query: AttributeListDto) {
    return this.attributeService.get(query, AttributeListDto);
  }

  @ApiOperation({ summary: 'Get attribute by ID' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 200, type: AttributeDto })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Attribute>,
  ) {
    const attribute = await this.attributeService.getSingle(id, query);
    if (!attribute) throw new NotFoundException('Attribute not found');
    return attribute;
  }

  @ApiOperation({ summary: 'Create attribute' })
  @ApiBody({ type: CreateAttributeDto })
  @ApiResponse({ status: 201, description: 'Attribute created successfully' })
  @Post()
  create(@Body() dto: CreateAttributeDto) {
    return this.attributeService.create(dto);
  }

  @ApiOperation({ summary: 'Update attribute by ID' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiBody({ type: UpdateAttributeDto })
  @ApiResponse({ status: 200, description: 'Attribute updated successfully' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributeService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete attribute by ID' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 200, description: 'Attribute deleted successfully' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.attributeService.delete(id);
  }
}
