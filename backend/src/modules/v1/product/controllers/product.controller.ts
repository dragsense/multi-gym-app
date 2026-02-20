import {
  Controller,
  Get,
  Body,
  Post,
  Delete,
  Param,
  Query,
  Patch,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { OmitType } from '@shared/lib/type-utils';

import { ProductService } from '../services/product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductListDto,
  ProductPaginatedDto,
  ProductDto,
  SingleQueryDto,
} from '@shared/dtos';
import { Product } from '../entities/product.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { NotFoundException } from '@nestjs/common';

@ApiBearerAuth('access-token')
@ApiTags('Products')
@MinUserLevel(EUserLevels.MEMBER)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @ApiOperation({ summary: 'Get all products with pagination and filtering' })
  @ApiResponse({ status: 200, type: ProductPaginatedDto })
  @Get()
  findAll(@Query() query: ProductListDto) {
    return this.productService.get(query, ProductListDto);
  }

  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, type: ProductDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Product>,
  ) {
    const product = await this.productService.getSingle(id, query);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'defaultImages', maxCount: 10 }]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create product' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @Post()
  create(
    @UploadedFiles()
    files: { defaultImages?: Express.Multer.File[] },
    @Body() dto: OmitType<CreateProductDto, 'defaultImages'>,
  ) {
    const defaultImages = files?.defaultImages;
    return this.productService.createProduct(dto, defaultImages);
  }

  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'defaultImages', maxCount: 10 }]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @UploadedFiles()
    files: { defaultImages?: Express.Multer.File[] },
    @Body() dto: OmitType<UpdateProductDto, 'defaultImages'>,
  ) {
    const defaultImages = files?.defaultImages;
    return this.productService.updateProduct(id, dto, defaultImages);
  }

  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productService.delete(id);
  }
}
