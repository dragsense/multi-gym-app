import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductService } from '../product/services/product.service';
import { ProductListDto, ProductPaginatedDto, ProductDto } from '@shared/dtos';
import { Product } from '../product/entities/product.entity';
import { MinUserLevel } from '@/decorators/level.decorator';
import { EUserLevels } from '@shared/enums';
import { NotFoundException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

@ApiTags('Store')
@MinUserLevel(EUserLevels.MEMBER)
@Controller('store')
export class StoreController {
  constructor(private readonly productService: ProductService) { }

  @ApiOperation({ summary: 'List active products (for staff and members)' })
  @ApiResponse({ status: 200, type: ProductPaginatedDto })
  @Get('products')
  async listProducts(@Query() query: ProductListDto) {
    return this.productService.get(
      { ...query, isActive: true } as ProductListDto,
      ProductListDto,
      {
        beforeQuery: (qb: SelectQueryBuilder<Product>) => {
          qb.andWhere('entity.isActive = :storeActive', { storeActive: true });
        },
      },
    );
  }

  @ApiOperation({ summary: 'Get product detail by ID (active only)' })
  @ApiResponse({ status: 200, type: ProductDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get('products/:id')
  async getProduct(
    @Param('id') id: string,
    @Query() query: { _relations?: string | string[] },
  ) {
    // Handle _relations - it comes as a comma-separated string from query params
    let relations: string[] = ['variants', 'productType', 'defaultImages'];
    if (query._relations) {
      relations = typeof query._relations === 'string'
        ? query._relations.split(',').map(r => r.trim())
        : query._relations;
    }

    const product = await this.productService.getSingle(id, {
      ...query,
      _relations: relations,
    } as any);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    if (!product.isActive) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @ApiOperation({ summary: 'Get related products by product type' })
  @ApiResponse({ status: 200, type: [ProductDto] })
  @Get('products/:id/related')
  async getRelatedProducts(
    @Param('id') id: string,
    @Query() query: any,
  ) {
    return this.productService.getRelatedProducts(id, query);
  }
}
