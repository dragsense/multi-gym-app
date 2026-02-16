import { Controller, Get, Body, Put, Delete, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CartDto, AddToCartDto } from '@shared/dtos';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiTags('Cart')
@MinUserLevel(EUserLevels.MEMBER)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({ status: 200, description: 'Returns cart', type: CartDto })
  @Get()
  async getCart(@AuthUser() user: User): Promise<CartDto> {
    return this.cartService.getCart(user.id);
  }

  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 200, description: 'Returns updated cart', type: CartDto })
  @Put('items')
  async addToCart(
    @Body() dto: AddToCartDto,
    @AuthUser() user: User,
  ): Promise<CartDto> {
    return this.cartService.addToCart(user.id, dto);
  }

  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Returns updated cart', type: CartDto })
  @Put('items/:productId')
  async updateItem(
    @Param('productId') productId: string,
    @Query('productVariantId') productVariantId: string | undefined,
    @Body() body: { quantity: number },
    @AuthUser() user: User,
  ): Promise<CartDto> {
    return this.cartService.updateCartItem(
      user.id,
      productId,
      productVariantId,
      body.quantity ?? 0,
    );
  }

  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Returns updated cart', type: CartDto })
  @Delete('items/:productId')
  async removeItem(
    @Param('productId') productId: string,
    @Query('productVariantId') productVariantId: string | undefined,
    @AuthUser() user: User,
  ): Promise<CartDto> {
    return this.cartService.removeFromCart(user.id, productId, productVariantId);
  }

  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  @Delete()
  async clearCart(@AuthUser() user: User): Promise<{ message: string }> {
    await this.cartService.clearCart(user.id);
    return { message: 'Cart cleared' };
  }
}
