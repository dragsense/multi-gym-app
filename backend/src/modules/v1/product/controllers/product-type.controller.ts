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
import { ProductTypeService } from '../services/product-type.service';
import {
  CreateProductTypeDto,
  UpdateProductTypeDto,
  ProductTypeListDto,
  ProductTypePaginatedDto,
  ProductTypeDto,
  SingleQueryDto,
} from '@shared/dtos';
import { ProductType } from '../entities/product-type.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiBearerAuth('access-token')
@ApiTags('Product Types')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('product-types')
export class ProductTypeController {
  constructor(private readonly productTypeService: ProductTypeService) {}

  @ApiOperation({ summary: 'Get all product types with pagination and filtering' })
  @ApiResponse({ status: 200, type: ProductTypePaginatedDto })
  @Get()
  findAll(@Query() query: ProductTypeListDto) {
    return this.productTypeService.get(query, ProductTypeListDto);
  }

  @ApiOperation({ summary: 'Get product type by ID' })
  @ApiParam({ name: 'id', description: 'Product type ID' })
  @ApiResponse({ status: 200, type: ProductTypeDto })
  @ApiResponse({ status: 404, description: 'Product type not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<ProductType>,
  ) {
    const productType = await this.productTypeService.getSingle(id, query);
    if (!productType) throw new NotFoundException('Product type not found');
    return productType;
  }

  @ApiOperation({ summary: 'Create product type' })
  @ApiBody({ type: CreateProductTypeDto })
  @ApiResponse({ status: 201, description: 'Product type created successfully' })
  @Post()
  create(@Body() dto: CreateProductTypeDto) {
    return this.productTypeService.create(dto);
  }

  @ApiOperation({ summary: 'Update product type by ID' })
  @ApiParam({ name: 'id', description: 'Product type ID' })
  @ApiBody({ type: UpdateProductTypeDto })
  @ApiResponse({ status: 200, description: 'Product type updated successfully' })
  @ApiResponse({ status: 404, description: 'Product type not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductTypeDto) {
    return this.productTypeService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete product type by ID' })
  @ApiParam({ name: 'id', description: 'Product type ID' })
  @ApiResponse({ status: 200, description: 'Product type deleted successfully' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productTypeService.delete(id);
  }
}
