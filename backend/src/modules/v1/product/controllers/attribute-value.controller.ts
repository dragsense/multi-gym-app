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
import { AttributeValueService } from '../services/attribute-value.service';
import {
  CreateAttributeValueDto,
  UpdateAttributeValueDto,
  AttributeValueListDto,
  AttributeValuePaginatedDto,
  AttributeValueDto,
  SingleQueryDto,
} from '@shared/dtos';
import { AttributeValue } from '../entities/attribute-value.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiBearerAuth('access-token')
@ApiTags('Attribute Values')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('attribute-values')
export class AttributeValueController {
  constructor(private readonly attributeValueService: AttributeValueService) {}

  @ApiOperation({ summary: 'Get attribute values, optionally by attribute ID' })
  @ApiResponse({ status: 200, type: AttributeValuePaginatedDto })
  @Get()
  findAll(@Query() query: AttributeValueListDto) {
    return this.attributeValueService.get(query, AttributeValueListDto);
  }

  @ApiOperation({ summary: 'Get attribute values by attribute ID (paginated)' })
  @ApiParam({ name: 'attributeId', description: 'Attribute ID' })
  @ApiResponse({ status: 200, type: AttributeValuePaginatedDto })
  @Get('by-attribute/:attributeId')
  findByAttribute(
    @Param('attributeId') attributeId: string,
    @Query() query: AttributeValueListDto,
  ) {
    return this.attributeValueService.get(query, AttributeValueListDto, {
      beforeQuery: (q: any) => {
        q.andWhere('entity.attributeId = :attributeId', { attributeId });
        return q;
      },
    });
  }

  @ApiOperation({ summary: 'Get attribute value by ID' })
  @ApiParam({ name: 'id', description: 'Attribute value ID' })
  @ApiResponse({ status: 200, type: AttributeValueDto })
  @ApiResponse({ status: 404, description: 'Attribute value not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<AttributeValue>,
  ) {
    const attributeValue = await this.attributeValueService.getSingle(id, query);
    if (!attributeValue) throw new NotFoundException('Attribute value not found');
    return attributeValue;
  }

  @ApiOperation({ summary: 'Create attribute value' })
  @ApiBody({ type: CreateAttributeValueDto })
  @ApiResponse({ status: 201, description: 'Attribute value created successfully' })
  @Post()
  create(@Body() dto: CreateAttributeValueDto) {
    return this.attributeValueService.createAttributeValue(dto);
  }

  @ApiOperation({ summary: 'Update attribute value by ID' })
  @ApiParam({ name: 'id', description: 'Attribute value ID' })
  @ApiBody({ type: UpdateAttributeValueDto })
  @ApiResponse({ status: 200, description: 'Attribute value updated successfully' })
  @ApiResponse({ status: 404, description: 'Attribute value not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAttributeValueDto) {
    return this.attributeValueService.updateAttributeValue(id, dto);
  }

  @ApiOperation({ summary: 'Delete attribute value by ID' })
  @ApiParam({ name: 'id', description: 'Attribute value ID' })
  @ApiResponse({ status: 200, description: 'Attribute value deleted successfully' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.attributeValueService.delete(id);
  }
}
